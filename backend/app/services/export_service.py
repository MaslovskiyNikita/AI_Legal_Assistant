import io
import asyncio
import re
from datetime import datetime
from docx import Document
from docx.shared import Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from fpdf import FPDF

def clean_xml_string(text: str) -> str:
    if not text:
        return ""
    return re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)

def _build_docx_sync(messages: list) -> io.BytesIO:
    doc = Document()
    date_str = datetime.now().strftime("%d.%m.%Y")

    header = doc.sections[0].header
    header_para = header.paragraphs[0]
    header_para.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    header_run = header_para.add_run(f"AI Legal Expert | Сгенерировано: {date_str}")
    header_run.font.color.rgb = RGBColor(142, 142, 147)
    header_run.font.size = Pt(10)

    title = doc.add_heading('Отчет о сравнении документов', level=1)
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER

    for msg in messages:
        role = msg.get('role', 'user')
        raw_text = msg.get('text', '') or ""
        text = clean_xml_string(raw_text)
        
        created_at = msg.get('created_at', datetime.now())
        prefix = "Пользователь" if role == "user" else "Legal Expert AI"
        time_str = created_at.strftime("%H:%M")

        p = doc.add_paragraph()
        
        name_run = p.add_run(f"{prefix} ({time_str}):\n")
        name_run.bold = True
        if role == "ai":
            name_run.font.color.rgb = RGBColor(51, 144, 236)
        
        text_run = p.add_run(text)
        text_run.font.size = Pt(11)

    footer = doc.sections[0].footer
    footer_para = footer.paragraphs[0]
    footer_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
    footer_run = footer_para.add_run("Документ подготовлен с помощью нейросети. Рекомендуется финальная проверка юристом.")
    footer_run.font.color.rgb = RGBColor(142, 142, 147)
    footer_run.font.size = Pt(9)

    stream = io.BytesIO()
    doc.save(stream)
    stream.seek(0)
    return stream

class ChatPDF(FPDF):
    def header(self):
        try:
            self.add_font("Roboto", "", "fonts/Roboto-Regular.ttf")
            self.add_font("Roboto", "B", "fonts/Roboto-Medium.ttf")
            self.set_font("Roboto", "B", 16)
        except:
            self.set_font("Arial", "B", 16)
            
        self.set_text_color(51, 144, 236)
        self.cell(100, 10, "AI Legal Expert", align="L")
        self.set_font("Roboto", "", 10) if "Roboto" in self.fonts else self.set_font("Arial", "", 10)
        self.set_text_color(142, 142, 147)
        self.cell(0, 10, f"Сгенерировано: {datetime.now().strftime('%d.%m.%Y')}", align="R")
        self.ln(15)
        self.set_draw_color(229, 229, 234)
        self.line(15, self.get_y(), 195, self.get_y())
        self.ln(10)

    def footer(self):
        self.set_y(-25)
        self.set_font("Arial", "", 8)
        self.set_text_color(142, 142, 147)
        self.cell(0, 10, "Документ подготовлен с помощью нейросети.", align="C")

def _build_pdf_sync(messages: list) -> io.BytesIO:
    pdf = ChatPDF()
    pdf.add_page()
    for msg in messages:
        role = msg.get('role', 'user')
        text = msg.get('text', '') or ""
        created_at = msg.get('created_at', datetime.now())
        
        pdf.set_font("Roboto", "B", 11) if "Roboto" in pdf.fonts else pdf.set_font("Arial", "B", 11)
        if role == "ai":
            pdf.set_text_color(51, 144, 236)
        else:
            pdf.set_text_color(0, 0, 0)
            
        pdf.cell(0, 8, f"{'AI' if role == 'ai' else 'User'} ({created_at.strftime('%H:%M')}):", ln=True)
        
        pdf.set_font("Roboto", "", 10) if "Roboto" in pdf.fonts else pdf.set_font("Arial", "", 10)
        pdf.set_text_color(0, 0, 0)
        pdf.multi_cell(0, 6, text)
        pdf.ln(5)

    output = pdf.output()
    if isinstance(output, str):
        output = output.encode('latin-1')
    
    stream = io.BytesIO(output)
    stream.seek(0)
    return stream

async def generate_docx_stream(messages: list) -> io.BytesIO:
    return await asyncio.to_thread(_build_docx_sync, messages)

async def generate_pdf_stream(messages: list) -> io.BytesIO:
    return await asyncio.to_thread(_build_pdf_sync, messages)