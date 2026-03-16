import json
from io import BytesIO
from typing import List
from docx import Document
from docx.shared import Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from .models import FullDocumentAnalysis

class ExportService:
    @staticmethod
    def generate_docx_report(diff_blocks_json: str, analysis: FullDocumentAnalysis) -> BytesIO:
        doc = Document()
        
        title = doc.add_paragraph()
        title.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = title.add_run("ОТЧЕТ ОБ АНАЛИЗЕ ИЗМЕНЕНИЙ")
        run.bold = True
        run.font.size = Pt(16)

        # Раздел с анализом (ставим его ВПЕРЕДИ, это важнее для юриста)
        doc.add_heading("Анализ рисков", level=2)
        risk_para = doc.add_paragraph()
        run_risk = risk_para.add_run(f"Общий уровень риска: {analysis.overall_risk.value}")
        run_risk.bold = True
        if analysis.overall_risk.value == "RED":
            run_risk.font.color.rgb = RGBColor(255, 0, 0)
        
        doc.add_paragraph(analysis.summary)
        
        if analysis.details:
            doc.add_heading("Детальный анализ", level=3)
            for detail in analysis.details:
                p = doc.add_paragraph()
                r = p.add_run(f"• {detail.title}: [{detail.risk.value}]")
                r.bold = True
                if detail.risk.value == "RED":
                    r.font.color.rgb = RGBColor(255, 0, 0)
                elif detail.risk.value == "YELLOW":
                    r.font.color.rgb = RGBColor(204, 153, 0) # Dark yellow/orange
                    
                doc.add_paragraph(detail.explanation)
                if detail.violated_law:
                    doc.add_paragraph(f"Нарушает/Связано с: {detail.violated_law}").italic = True

        # Раздел с diff (Таблица изменений)
        doc.add_heading("Таблица изменений", level=2)
        
        try:
            blocks = json.loads(diff_blocks_json)
            # Фильтруем UNCHANGED для отчета
            changed_blocks = [b for b in blocks if b.get('change_type') != 'UNCHANGED']
            
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
                    old_b = b.get('old_block')
                    new_b = b.get('new_block')
                    row_cells[1].text = old_b.get('text', '') if old_b else '-'
                    row_cells[2].text = new_b.get('text', '') if new_b else '-'
            else:
                doc.add_paragraph("Значимых изменений не найдено.")
        except Exception as e:
            doc.add_paragraph("Не удалось сформировать таблицу изменений.")

        out = BytesIO()
        doc.save(out)
        out.seek(0)
        return out

