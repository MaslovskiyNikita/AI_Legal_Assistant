import io
from datetime import datetime
from docx import Document
from docx.shared import Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from fpdf import FPDF

async def generate_docx_stream(messages) -> io.BytesIO:
    doc = Document()
    date_str = datetime.now().strftime("%d.%m.%Y")

    header = doc.sections[0].header
    header_para = header.paragraphs[0]
    header_para.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    header_run = header_para.add_run(f"AI Legal Expert | Сгенерировано: {date_str}")
    header_run.font.color.rgb = RGBColor(142, 142, 147) # 8E8E93
    header_run.font.size = Pt(10)

    title = doc.add_heading('Отчет о сравнении документов', level=1)
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER

    for msg in messages:
        role = getattr(msg, 'role', 'user')
        text = getattr(msg, 'text', getattr(msg, 'content', ''))
        created_at = getattr(msg, 'created_at', datetime.now())
        
        prefix = "Пользователь" if role == "user" else "Legal Expert AI"
        time_str = created_at.strftime("%H:%M")

        p = doc.add_paragraph()
        
        name_run = p.add_run(f"{prefix} ({time_str}):\n")
        name_run.bold = True
        name_run.font.size = Pt(12)
        if role == "ai":
            name_run.font.color.rgb = RGBColor(51, 144, 236)
        else:
            name_run.font.color.rgb = RGBColor(0, 0, 0)

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
        date_str = datetime.now().strftime("%d.%m.%Y")
        self.set_font("Roboto", "B", 16)
        self.set_text_color(51, 144, 236)
        self.cell(100, 10, "AI Legal Expert", align="L")
        
        self.set_font("Roboto", "", 10)
        self.set_text_color(142, 142, 147)
        self.cell(0, 10, f"Сгенерировано: {date_str}", align="R")
        self.ln(15)
        
        self.set_draw_color(229, 229, 234)
        self.line(15, self.get_y(), 195, self.get_y())
        self.ln(10)
        
        self.set_font("Roboto", "B", 14)
        self.set_text_color(0, 0, 0)
        self.cell(0, 10, "Отчет о сравнении документов", align="C")
        self.ln(15)

    def footer(self):
        self.set_y(-25)
        self.set_draw_color(229, 229, 234)
        self.line(15, self.get_y(), 195, self.get_y())
        self.ln(5)
        self.set_font("Roboto", "", 8)
        self.set_text_color(142, 142, 147)
        self.cell(0, 10, "Документ подготовлен с помощью нейросети. Рекомендуется финальная проверка юристом.", align="C")

async def generate_pdf_stream(messages) -> io.BytesIO:
    pdf = ChatPDF()
    
    pdf.add_font("Roboto", "", "fonts/Roboto-Regular.ttf")
    pdf.add_font("Roboto", "B", "fonts/Roboto-Medium.ttf")
    
    pdf.add_page()
    
    for msg in messages:
        role = getattr(msg, 'role', 'user')
        text = getattr(msg, 'text', getattr(msg, 'content', ''))
        created_at = getattr(msg, 'created_at', datetime.now())
        
        prefix = "Пользователь" if role == "user" else "Legal Expert AI"
        time_str = created_at.strftime("%H:%M")

        pdf.set_font("Roboto", "B", 11)
        if role == "ai":
            pdf.set_text_color(51, 144, 236)
        else:
            pdf.set_text_color(0, 0, 0)
            
        pdf.cell(0, 8, f"{prefix} ({time_str}):", ln=True)
        
        pdf.set_font("Roboto", "", 10)
        pdf.set_text_color(0, 0, 0)
        pdf.multi_cell(0, 6, text)
        pdf.ln(5)

    stream = io.BytesIO(pdf.output())
    stream.seek(0)
    return stream