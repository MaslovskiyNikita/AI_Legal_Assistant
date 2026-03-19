import re
from io import BytesIO
import fitz  # PyMuPDF
from docx import Document
from ..models import DocumentBlock
from docx.text.paragraph import Paragraph


class DocumentParser:
    STRUCTURAL_REGEX = re.compile(r"^(Статья\s+\d+|Глава\s+[IXV]+|\d+(\.\d+)*\.?)\s*", re.IGNORECASE)

    @staticmethod
    def _detect_file_type(file_stream: BytesIO) -> str:
        """Определяет тип файла (pdf или docx) по его первым байтам (магическим числам)."""
        file_stream.seek(0)
        header = file_stream.read(5)
        file_stream.seek(0)

        if header.startswith(b'%PDF-'):
            return 'pdf'
        elif header.startswith(b'PK\x03\x04'):
            return 'docx'
        else:
            raise ValueError("Неподдерживаемый формат файла. Ожидается DOCX или PDF.")

    @classmethod
    def parse_to_text(cls, file_stream: BytesIO) -> str:
        file_type = cls._detect_file_type(file_stream)
        if file_type == 'docx':
            return cls._parse_docx_to_text(file_stream)
        elif file_type == 'pdf':
            return cls._parse_pdf_to_text(file_stream)

    @classmethod
    def parse(cls, file_stream: BytesIO) -> list[DocumentBlock]:
        file_type = cls._detect_file_type(file_stream)
        if file_type == 'docx':
            return cls._parse_docx(file_stream)
        elif file_type == 'pdf':
            return cls._parse_pdf(file_stream)

    # ==========================
    # DOCX LOGIC
    # ==========================
    @staticmethod
    def _parse_docx_to_text(file_stream: BytesIO) -> str:
        doc = Document(file_stream)
        text_parts = []
        for element in doc.element.body:
            if element.tag.endswith('p'):
                p = Paragraph(element, doc)
                text = p.text.strip()
                if text:
                    text_parts.append(text)
            elif element.tag.endswith('tbl'):
                from docx.table import Table
                t = Table(element, doc)
                for row in t.rows:
                    text_parts.append(" ".join(cell.text.strip() for cell in row.cells))
        return "\n\n".join(text_parts)

    @staticmethod
    def _parse_docx(file_stream: BytesIO) -> list[DocumentBlock]:
        doc = Document(file_stream)
        blocks = []
        current_index = 0

        for element in doc.element.body:
            raw_text = ""
            if element.tag.endswith('p'):
                p = Paragraph(element, doc)
                raw_text = p.text.strip()
            elif element.tag.endswith('tbl'):
                from docx.table import Table
                t = Table(element, doc)
                rows_text = [" ".join(cell.text.strip() for cell in row.cells) for row in t.rows]
                raw_text = "\n".join(rows_text).strip()

            if not raw_text:
                continue

            match = DocumentParser.STRUCTURAL_REGEX.match(raw_text)
            block_id = match.group(0).strip() if match else None

            blocks.append(DocumentBlock(
                index=current_index,
                id=block_id,
                text=raw_text,
                hash=DocumentBlock.generate_hash(raw_text)
            ))
            current_index += 1

        return blocks

    # ==========================
    # PDF LOGIC (PyMuPDF - fitz)
    # ==========================
    @staticmethod
    def _parse_pdf_to_text(file_stream: BytesIO) -> str:
        file_stream.seek(0)
        doc = fitz.open(stream=file_stream.read(), filetype="pdf")
        text_parts = []

        for page in doc:
            # Извлекаем текст блоками для сохранения структуры абзацев
            blocks = page.get_text("blocks")
            for b in blocks:
                if b[6] == 0:  # Проверка, что блок - это текст, а не картинка (type=0)
                    clean_text = b[4].strip()
                    if clean_text:
                        # Убираем переносы слов и склеиваем строки внутри одного абзаца
                        clean_text = re.sub(r'-\n\s*', '', clean_text)
                        clean_text = re.sub(r'\s+', ' ', clean_text.replace('\n', ' '))
                        text_parts.append(clean_text)

        return "\n\n".join(text_parts)

    @staticmethod
    def _parse_pdf(file_stream: BytesIO) -> list[DocumentBlock]:
        file_stream.seek(0)
        doc = fitz.open(stream=file_stream.read(), filetype="pdf")
        blocks = []
        current_index = 0

        for page in doc:
            # get_text("blocks") возвращает список кортежей с координатами и текстом.
            # Элемент [4] - это сам текст, [6] - тип блока (0 - текст, 1 - картинка)
            text_blocks = page.get_text("blocks")

            for b in text_blocks:
                if b[6] != 0:
                    continue  # Игнорируем картинки

                raw_text = b[4].strip()
                if not raw_text:
                    continue

                # 1. Очистка: убираем переносы слов (тире) и лишние пробелы внутри блока
                clean_text = re.sub(r'-\n\s*', '', raw_text)
                clean_text = re.sub(r'\s+', ' ', clean_text.replace('\n', ' '))

                # 2. Страховка: Если PyMuPDF объединил 2 логических пункта в 1 визуальный блок
                # (напр: "...закон. Статья 5. Новый текст..."), принудительно разрываем их
                split_pattern = r'(?<=[.!?])\s+(?=(Статья\s+\d+|Глава\s+[IXV]+|\d+(\.\d+)*\.)\s)'
                sub_blocks = re.split(split_pattern, clean_text)

                # Собираем разделенные части обратно корректно
                # re.split оставляет разделители в списке, если они в (группах), фильтруем их
                final_parts = []
                current_part = ""

                for part in sub_blocks:
                    if not part: continue
                    if DocumentParser.STRUCTURAL_REGEX.match(part):
                        if current_part:
                            final_parts.append(current_part.strip())
                        current_part = part + " "
                    else:
                        current_part += part
                if current_part:
                    final_parts.append(current_part.strip())

                # 3. Формируем финальные DocumentBlock
                for part_text in final_parts:
                    if not part_text:
                        continue

                    match = DocumentParser.STRUCTURAL_REGEX.match(part_text)
                    block_id = match.group(0).strip() if match else None

                    blocks.append(DocumentBlock(
                        index=current_index,
                        id=block_id,
                        text=part_text,
                        hash=DocumentBlock.generate_hash(part_text)
                    ))
                    current_index += 1

        return blocks