import re
from io import BytesIO
from docx import Document
from ..models import DocumentBlock
from docx.text.paragraph import Paragraph

class DocxParser:
    STRUCTURAL_REGEX = re.compile(r"^(Статья\s+\d+|Глава\s+[IXV]+|\d+(\.\d+)*\.?)\s*", re.IGNORECASE)

    @staticmethod
    def parse_to_text(file_stream: BytesIO) -> str:
        """
        Парсит документ в полный текст, разделяя параграфы и таблицы переносами строк.
        """
        doc = Document(file_stream)
        text_parts = []
        
        for element in doc.element.body:
            if element.tag.endswith('p'):  # Параграф
                p = Paragraph(element, doc)
                text = p.text.strip()
                if text:
                    text_parts.append(text)
            elif element.tag.endswith('tbl'):  # Таблица
                from docx.table import Table
                t = Table(element, doc)
                rows_text = []
                for row in t.rows:
                    rows_text.append(" ".join(cell.text.strip() for cell in row.cells))
                table_text = "\n".join(rows_text).strip()
                if table_text:
                    text_parts.append(table_text)
        
        return "\n\n".join(text_parts)

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