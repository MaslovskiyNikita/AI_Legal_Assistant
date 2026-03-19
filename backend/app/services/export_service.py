import io
import asyncio
import re
import os
import docx
from datetime import datetime
from docx import Document
from docx.shared import Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.shared import OxmlElement
from docx.oxml.ns import qn
from fpdf import FPDF
from loguru import logger

# Импортируем наш вынесенный словарь
from backend_llm.app.core.law_sources import LAW_SOURCES


# --- УТИЛИТЫ ---

def clean_xml_string(text: str) -> str:
    if not text:
        return ""
    return re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)


def _md_to_html(text: str) -> str:
    """Преобразует Markdown в простой HTML для FPDF."""
    if not text:
        return ""
    text = re.sub(r'\*\*\*(.*?)\*\*\*', r'<b><i>\1</i></b>', text)
    text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', text)
    text = re.sub(r'\*(.*?)\*', r'<i>\1</i>', text)
    text = text.replace('\n', '<br>')
    return text


def _parse_markdown_to_docx(paragraph, text: str):
    """Парсит Markdown и добавляет отформатированные runs в DOCX."""
    lines = text.split('\n')
    for i, line in enumerate(lines):
        if i > 0:
            paragraph.add_run('\n')

        pattern = r'(\*\*\*.*?\*\*\*|\*\*.*?\*\*|\*.*?\*)'
        parts = re.split(pattern, line)

        for part in parts:
            if not part:
                continue
            if part.startswith('***') and part.endswith('***'):
                run = paragraph.add_run(part[3:-3])
                run.bold = True
                run.italic = True
            elif part.startswith('**') and part.endswith('**'):
                run = paragraph.add_run(part[2:-2])
                run.bold = True
            elif part.startswith('*') and part.endswith('*'):
                run = paragraph.add_run(part[1:-1])
                run.italic = True
            else:
                run = paragraph.add_run(part)

            run.font.size = Pt(11)


def _render_content_docx(doc, text: str):
    """Обрабатывает блоки текста (заголовки, списки) для DOCX анализа."""
    if not text:
        return

    lines = text.split('\n')
    for line in lines:
        clean_line = line.strip()
        if not clean_line:
            doc.add_paragraph()
            continue

        if clean_line.startswith('### '):
            doc.add_heading(clean_line.replace('### ', ''), level=3)
        elif clean_line.startswith('## '):
            doc.add_heading(clean_line.replace('## ', ''), level=2)
        elif clean_line.startswith('# '):
            doc.add_heading(clean_line.replace('# ', ''), level=1)

        elif clean_line.startswith('* ') or clean_line.startswith('- '):
            p = doc.add_paragraph(style='List Bullet')
            _parse_markdown_to_docx(p, clean_line[2:])

        elif re.match(r'^\d+\.\s', clean_line):
            p = doc.add_paragraph(style='List Number')
            content = re.sub(r'^\d+\.\s', '', clean_line)
            _parse_markdown_to_docx(p, content)

        else:
            p = doc.add_paragraph()
            _parse_markdown_to_docx(p, clean_line)


def _get_source_url(law_text: str) -> str:
    """Ищет ссылку в словаре по ключевым словам."""
    if not law_text:
        return ""
    law_text_lower = law_text.lower()

    for key, url in LAW_SOURCES.items():
        if key in law_text_lower:
            return url
    return ""


def _add_hyperlink(paragraph, text: str, url: str):
    """Добавляет кликабельную ссылку в параграф DOCX."""
    part = paragraph.part
    r_id = part.relate_to(url, docx.opc.constants.RELATIONSHIP_TYPE.HYPERLINK, is_external=True)

    hyperlink = OxmlElement('w:hyperlink')
    hyperlink.set(qn('r:id'), r_id)

    new_run = OxmlElement('w:r')
    rPr = OxmlElement('w:rPr')

    # Делаем ссылку синей и подчеркнутой
    c = OxmlElement('w:color')
    c.set(qn('w:val'), '0000FF')
    rPr.append(c)
    u = OxmlElement('w:u')
    u.set(qn('w:val'), 'single')
    rPr.append(u)
    new_run.append(rPr)

    text_elem = OxmlElement('w:t')
    text_elem.text = text
    new_run.append(text_elem)

    hyperlink.append(new_run)
    paragraph._p.append(hyperlink)


# --- PDF КЛАСС ---

class ChatPDF(FPDF):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.roboto_loaded = False

        reg_path = "/app/fonts/Roboto-Regular.ttf"
        med_path = "/app/fonts/Roboto-Medium.ttf"

        try:
            if os.path.exists(reg_path) and os.path.exists(med_path):
                self.add_font("Roboto", "", reg_path)
                self.add_font("Roboto", "B", med_path)
                self.add_font("Roboto", "I", reg_path)
                self.roboto_loaded = True
                logger.info("✅ PDF: Шрифты Roboto успешно подключены")
            else:
                logger.error(f"❌ PDF: Шрифты не найдены по путям: {reg_path}, {med_path}")
        except Exception as e:
            logger.error(f"❌ PDF: Ошибка загрузки шрифтов: {e}")

    def header(self):
        font_name = "Roboto" if self.roboto_loaded else "Helvetica"

        self.set_font(font_name, "B", 16)
        self.set_text_color(51, 144, 236)
        self.cell(0, 10, "AI Legal Expert", align="L")

        self.set_y(10)
        self.set_font(font_name, "", 10)
        self.set_text_color(142, 142, 147)
        meta_text = f"Сгенерировано: {datetime.now().strftime('%d.%m.%Y')}" if self.roboto_loaded else f"Generated: {datetime.now().strftime('%d.%m.%Y')}"
        self.cell(0, 10, meta_text, align="R")
        self.ln(15)

        self.set_draw_color(229, 229, 234)
        self.line(15, self.get_y(), 195, self.get_y())
        self.ln(10)


# --- ЭКСПОРТ ИСТОРИИ ЧАТА ---

def _build_pdf_sync(messages: list) -> io.BytesIO:
    pdf = ChatPDF()
    pdf.add_page()

    font_name = pdf.font_family
    pdf.set_font(font_name, "B", 14)
    pdf.set_text_color(0, 0, 0)

    title_text = "Отчет о переписке" if pdf.roboto_loaded else "Chat History Report"
    pdf.cell(0, 10, title_text, align="C", ln=True)
    pdf.ln(10)

    for msg in messages:
        role = msg.get('role', 'user')
        text = clean_xml_string(msg.get('text', '') or msg.get('content', ''))

        pdf.set_font(font_name, "B", 11)
        if role == "ai":
            pdf.set_text_color(51, 144, 236)
            prefix = "Legal Expert AI"
        else:
            pdf.set_text_color(0, 0, 0)
            prefix = "Пользователь" if pdf.roboto_loaded else "User"

        pdf.cell(0, 8, f"{prefix}:", ln=True)

        pdf.set_font(font_name, "", 10)
        pdf.set_text_color(0, 0, 0)

        html_text = _md_to_html(text)
        pdf.write_html(html_text)
        pdf.ln(5)

    stream = io.BytesIO(pdf.output())
    stream.seek(0)
    return stream


def _build_docx_sync(messages: list) -> io.BytesIO:
    doc = Document()
    date_str = datetime.now().strftime("%d.%m.%Y")

    section = doc.sections[0]
    header = section.header
    header_para = header.paragraphs[0]
    header_para.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    run = header_para.add_run(f"AI Legal Expert | Сгенерировано: {date_str}")
    run.font.color.rgb = RGBColor(142, 142, 147)
    run.font.size = Pt(10)

    title = doc.add_heading('Отчет о переписке', level=1)
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER

    for msg in messages:
        role = msg.get('role', 'user')
        text = clean_xml_string(msg.get('text', '') or msg.get('content', ''))
        prefix = "Пользователь" if role == "user" else "Legal Expert AI"

        p = doc.add_paragraph()
        name_run = p.add_run(f"{prefix}:\n")
        name_run.bold = True
        if role == "ai":
            name_run.font.color.rgb = RGBColor(51, 144, 236)

        _parse_markdown_to_docx(p, text)

    footer = section.footer
    f_para = footer.paragraphs[0]
    f_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
    f_run = f_para.add_run("Документ подготовлен с помощью нейросети. Рекомендуется финальная проверка юристом.")
    f_run.font.color.rgb = RGBColor(142, 142, 147)
    f_run.font.size = Pt(9)

    stream = io.BytesIO()
    doc.save(stream)
    stream.seek(0)
    return stream


# --- ЭКСПОРТ АНАЛИЗА РИСКОВ ---

def _build_analysis_docx_sync(analysis_data: dict, diff_blocks: list) -> io.BytesIO:
    doc = Document()
    date_str = datetime.now().strftime("%d.%m.%Y")

    section = doc.sections[0]
    header = section.header
    header_para = header.paragraphs[0]
    header_para.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    run = header_para.add_run(f"AI Legal Expert | Сгенерировано: {date_str}")
    run.font.color.rgb = RGBColor(142, 142, 147)
    run.font.size = Pt(10)

    title = doc.add_heading("ОТЧЕТ ОБ АНАЛИЗЕ ИЗМЕНЕНИЙ", level=1)
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER

    doc.add_heading("Анализ рисков", level=2)
    risk_val = analysis_data.get("overall_risk", "UNKNOWN")

    risk_para = doc.add_paragraph()
    run_risk = risk_para.add_run(f"Общий уровень риска: {risk_val}")
    run_risk.bold = True
    if risk_val == "RED":
        run_risk.font.color.rgb = RGBColor(255, 0, 0)
    elif risk_val == "YELLOW":
        run_risk.font.color.rgb = RGBColor(204, 153, 0)

    _render_content_docx(doc, analysis_data.get("summary", ""))

    details = analysis_data.get("details", [])
    if details:
        doc.add_heading("Детальный анализ", level=3)
        for detail in details:
            p = doc.add_paragraph()
            r_val = detail.get("risk", "UNKNOWN")
            r = p.add_run(f"• {detail.get('title', 'Без названия')}: [{r_val}]")
            r.bold = True
            if r_val == "RED":
                r.font.color.rgb = RGBColor(255, 0, 0)
            elif r_val == "YELLOW":
                r.font.color.rgb = RGBColor(204, 153, 0)

            _render_content_docx(doc, detail.get("explanation", ""))

            violated_law = detail.get("violated_law")
            if violated_law:
                # Добавляем законодательство и кликабельную ссылку (если есть в словаре)
                p_law = doc.add_paragraph("Законодательство: ")
                p_law.add_run(violated_law).italic = True

                url = _get_source_url(violated_law)
                if url:
                    p_law.add_run(" (")
                    _add_hyperlink(p_law, "открыть источник", url)
                    p_law.add_run(")")

    doc.add_heading("Таблица изменений", level=2)
    try:
        changed_blocks = [b for b in diff_blocks if b.get('change_type') != 'UNCHANGED']
        if changed_blocks:
            table = doc.add_table(rows=1, cols=3)
            table.style = 'Table Grid'
            hdr_cells = table.rows[0].cells
            hdr_cells[0].text = 'Тип'
            hdr_cells[1].text = 'Было'
            hdr_cells[2].text = 'Стало'
            for b in changed_blocks:
                row_cells = table.add_row().cells
                row_cells[0].text = b.get('change_type', '')
                old_b = b.get('old_block') or {}
                new_b = b.get('new_block') or {}
                row_cells[1].text = re.sub(r'\*{1,3}', '', old_b.get('text', '-')) if old_b else '-'
                row_cells[2].text = re.sub(r'\*{1,3}', '', new_b.get('text', '-')) if new_b else '-'
        else:
            doc.add_paragraph("Значимых изменений не найдено.")
    except Exception as e:
        doc.add_paragraph(f"Ошибка формирования таблицы: {str(e)}")

    stream = io.BytesIO()
    doc.save(stream)
    stream.seek(0)
    return stream


def _build_analysis_pdf_sync(analysis_data: dict, diff_blocks: list) -> io.BytesIO:
    pdf = ChatPDF()
    pdf.add_page()

    font_name = pdf.font_family

    pdf.set_font(font_name, 'B', 16)
    pdf.cell(0, 10, "ОТЧЕТ ОБ АНАЛИЗЕ ИЗМЕНЕНИЙ", ln=True, align='C')
    pdf.ln(5)

    pdf.set_font(font_name, 'B', 14)
    pdf.cell(0, 10, "Анализ рисков", ln=True)

    risk_val = analysis_data.get("overall_risk", "UNKNOWN")
    if risk_val == "RED":
        pdf.set_text_color(255, 0, 0)
    pdf.set_font(font_name, 'B', 12)
    pdf.cell(0, 10, f"Общий уровень риска: {risk_val}", ln=True)
    pdf.set_text_color(0, 0, 0)

    pdf.set_font(font_name, '', 11)
    pdf.write_html(_md_to_html(analysis_data.get("summary", "")))
    pdf.ln(10)

    details = analysis_data.get("details", [])
    if details:
        pdf.set_font(font_name, 'B', 13)
        pdf.cell(0, 10, "Детальный анализ", ln=True)
        for detail in details:
            r_val = detail.get("risk", "UNKNOWN")
            title = detail.get("title", "Без названия")
            header_html = f"<b>• {title} [{r_val}]</b>"
            pdf.write_html(header_html)
            pdf.ln(5)

            pdf.write_html(_md_to_html(detail.get("explanation", "")))

            violated_law = detail.get("violated_law")
            if violated_law:
                pdf.ln(2)
                url = _get_source_url(violated_law)
                if url:
                    pdf.write_html(f"<i>Связано с: {violated_law} (<a href='{url}'>открыть источник</a>)</i>")
                else:
                    pdf.write_html(f"<i>Связано с: {violated_law}</i>")
            pdf.ln(8)

    pdf.ln(5)
    pdf.set_font(font_name, 'B', 13)
    pdf.multi_cell(0, 10, "Таблица изменений")

    try:
        changed = [b for b in diff_blocks if b.get('change_type') != 'UNCHANGED']
        if changed:
            pdf.set_font(font_name, 'B', 10)
            col_width = pdf.epw / 3

            pdf.cell(col_width, 10, "Тип", border=1)
            pdf.cell(col_width, 10, "Было", border=1)
            pdf.cell(col_width, 10, "Стало", border=1)
            pdf.ln()

            pdf.set_font(font_name, '', 9)
            for b in changed:
                old_b = b.get('old_block') or {}
                new_b = b.get('new_block') or {}
                old_txt = re.sub(r'\*{1,3}', '', old_b.get('text', '-')) if old_b else '-'
                new_txt = re.sub(r'\*{1,3}', '', new_b.get('text', '-')) if new_b else '-'

                max_lines = max(pdf.get_nb_lines(col_width, old_txt), pdf.get_nb_lines(col_width, new_txt))
                line_height = 6
                row_h = max_lines * line_height

                if pdf.get_y() + row_h > 270:
                    pdf.add_page()

                x = pdf.get_x()
                y = pdf.get_y()

                pdf.multi_cell(col_width, row_h / max(1, pdf.get_nb_lines(col_width, b.get('change_type', ''))),
                               b.get('change_type', ''), border=1)
                pdf.set_xy(x + col_width, y)
                pdf.multi_cell(col_width, line_height, old_txt, border=1)
                pdf.set_xy(x + col_width * 2, y)
                pdf.multi_cell(col_width, line_height, new_txt, border=1)
                pdf.set_y(y + row_h)
        else:
            pdf.cell(0, 10, "Изменений не найдено", ln=True)
    except Exception as e:
        pdf.cell(0, 10, f"Ошибка формирования таблицы: {str(e)}", ln=True)

    stream = io.BytesIO(pdf.output())
    stream.seek(0)
    return stream


# --- ASYNC ОБЕРТКИ ДЛЯ ФАСТАПИ ---

async def generate_docx_stream(messages: list) -> io.BytesIO:
    return await asyncio.to_thread(_build_docx_sync, messages)


async def generate_pdf_stream(messages: list) -> io.BytesIO:
    return await asyncio.to_thread(_build_pdf_sync, messages)


async def generate_analysis_docx_stream(analysis_data: dict, diff_blocks: list) -> io.BytesIO:
    return await asyncio.to_thread(_build_analysis_docx_sync, analysis_data, diff_blocks)


async def generate_analysis_pdf_stream(analysis_data: dict, diff_blocks: list) -> io.BytesIO:
    return await asyncio.to_thread(_build_analysis_pdf_sync, analysis_data, diff_blocks)