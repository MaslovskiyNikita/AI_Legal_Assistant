import re
from io import BytesIO
from pypdf import PdfReader  # Используем чистый Python-парсер
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
                from docx.text.paragraph import Paragraph
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
    # PDF LOGIC
    # ==========================
    @staticmethod
    def _parse_pdf_to_text(file_stream: BytesIO) -> str:
        reader = PdfReader(file_stream)
        text_parts = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                text_parts.append(text.strip())
        return "\n\n".join(text_parts)

    @staticmethod
    def _parse_pdf(file_stream: BytesIO) -> list[DocumentBlock]:
        reader = PdfReader(file_stream)
        blocks = []
        current_index = 0

        # Шаг 1. Собираем весь сырой текст
        full_text = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                full_text.append(text)

        raw_text = "\n".join(full_text)

        # ДОБАВЛЕНО: Очистка артефактов PDF
        # 1. Убираем переносы слов (тире на конце строки)
        raw_text = re.sub(r'-\n\s*', '', raw_text)
        # 2. Нормализуем случайные длинные пробелы внутри строк (но сохраняем \n)
        raw_text = re.sub(r'[ \t]+', ' ', raw_text)

        # 3. ПРИНУДИТЕЛЬНЫЙ РАЗРЫВ: Если pypdf склеил пункты (напр: "...текст. 2. Новый текст"),
        # принудительно вставляем \n перед структурой, чтобы сработал STRUCTURAL_REGEX
        structural_pattern = r'([\.!?]\s+|<br>)(Статья\s+\d+|Глава\s+[IXV]+|\d+(\.\d+)*\.)(\s)'
        raw_text = re.sub(structural_pattern, r'\n\2\4', raw_text, flags=re.IGNORECASE)

        lines = raw_text.splitlines()

        paragraphs = []
        current_para = []

        # Шаг 2. Разбираем строки
        for line in lines:
            line = line.strip()
            if not line:
                if current_para:
                    paragraphs.append(" ".join(current_para))
                    current_para = []
                continue

            if current_para:
                prev_line = current_para[-1]

                is_structural = bool(DocumentParser.STRUCTURAL_REGEX.match(line))
                ends_with_terminal = prev_line.endswith(('.', ';', ':', '!', '?'))
                starts_with_upper_or_digit = line[0].isupper() or line[0].isdigit() or line.startswith(('"', '«'))

                # ДОБАВЛЕНО: Защита от огромных абзацев. Если накопили больше 800 символов и есть конец предложения - рубим!
                current_length = sum(len(l) for l in current_para)
                is_too_long = current_length > 800 and ends_with_terminal

                if is_structural or (ends_with_terminal and starts_with_upper_or_digit) or is_too_long:
                    paragraphs.append(" ".join(current_para))
                    current_para = [line]
                else:
                    current_para.append(line)
            else:
                current_para.append(line)

        if current_para:
            paragraphs.append(" ".join(current_para))

        # Шаг 3. Формируем DocumentBlock
        for raw_para in paragraphs:
            raw_para = raw_para.strip()
            if not raw_para:
                continue

            match = DocumentParser.STRUCTURAL_REGEX.match(raw_para)
            block_id = match.group(0).strip() if match else None

            blocks.append(DocumentBlock(
                index=current_index,
                id=block_id,
                text=raw_para,
                hash=DocumentBlock.generate_hash(raw_para)
            ))
            current_index += 1

        return blocks