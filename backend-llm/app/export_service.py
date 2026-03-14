from io import BytesIO
from docx import Document
from docx.shared import Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from .models import FullDocumentAnalysis

class ExportService:
    @staticmethod
    def generate_docx_report(diff_text: str, analysis: FullDocumentAnalysis) -> BytesIO:
        doc = Document()
        
        title = doc.add_paragraph()
        title.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = title.add_run("ОТЧЕТ ОБ АНАЛИЗЕ ИЗМЕНЕНИЙ")
        run.bold = True
        run.font.size = Pt(16)

        # Раздел с diff
        doc.add_heading("Изменения (Diff)", level=2)
        diff_para = doc.add_paragraph()
        diff_para.add_run(diff_text).font.name = 'Courier New'

        # Раздел с анализом
        doc.add_heading("Анализ рисков", level=2)
        risk_para = doc.add_paragraph()
        run_risk = risk_para.add_run(f"Общий уровень риска: {analysis.overall_risk}")
        run_risk.bold = True
        
        doc.add_paragraph(analysis.summary)
        
        if analysis.details:
            doc.add_heading("Детальный анализ", level=3)
            for detail in analysis.details:
                p = doc.add_paragraph()
                p.add_run(f"• {detail.title}: {detail.risk}").bold = True
                doc.add_paragraph(detail.explanation)
                if detail.violated_law:
                    doc.add_paragraph(f"Нарушает: {detail.violated_law}").italic = True

        out = BytesIO()
        doc.save(out)
        out.seek(0)
        return out