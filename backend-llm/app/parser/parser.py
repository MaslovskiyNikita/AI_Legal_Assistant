import re
from io import BytesIO
from docx import Document
from ..models import DocumentBlock

class DocxParser:
    STRUCTURAL_REGEX = re.compile(r"^(Статья\s+\d+|Глава\s+[IXV]+|\d+(\.\d+)*\.?)\s*", re.IGNORECASE)

    @staticmethod
    def parse(file_stream: BytesIO) -> list[DocumentBlock]:
        doc = Document(file_stream)
        blocks = []
        current_index = 0

        for element in doc.element.body:
            raw_text = ""
            if element.tag.endswith('p'): # Параграф
                from docx.text.paragraph import Paragraph
                p = Paragraph(element, doc)
                raw_text = p.text.strip()
            elif element.tag.endswith('tbl'): # Таблица
                from docx.table import Table
                t = Table(element, doc)
                rows_text = []
                for row in t.rows:
                    rows_text.append(" ".join(cell.text.strip() for cell in row.cells))
                raw_text = "\n".join(rows_text).strip()

            if not raw_text:
                continue

            match = DocxParser.STRUCTURAL_REGEX.match(raw_text)
            block_id = match.group(0).strip() if match else None

            blocks.append(DocumentBlock(
                index=current_index,
                id=block_id,
                text=raw_text,
                hash=DocumentBlock.generate_hash(raw_text)
            ))
            current_index += 1
            
        return blocks