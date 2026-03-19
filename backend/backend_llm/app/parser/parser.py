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

        # Шаг 1. Собираем весь текст
        full_text = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                full_text.append(text)

        raw_text = " ".join(full_text)

        # Шаг 2. Очистка от мусора PDF
        # Убираем переносы слов (тире) и двойные пробелы
        raw_text = re.sub(r'-\n\s*', '', raw_text)
        raw_text = re.sub(r'\s+', ' ', raw_text)

        # Шаг 3. УМНАЯ РАЗБИВКА НА ЛОГИЧЕСКИЕ ЧАСТИ (Решение проблемы "Огромных блоков")

        # А) Разрываем юридические перечисления (точка с запятой + пробел)
        raw_text = raw_text.replace('; ', ';\n')

        # Б) Ищем "вклеенные" пункты (например "Текст. 1. Новый текст", "Текст. Статья 5. Текст")
        # Вставляем перенос строки перед цифрой с точкой, если за ней идет Заглавная буква
        struct_pattern = r'(?<=\s|^)(Статья\s+\d+|Глава\s+[IXV]+|\d+(\.\d+)*\.)\s+(?=[А-ЯЁA-Z])'
        raw_text = re.sub(struct_pattern, r'\n\1 ', raw_text)

        # В) Разрываем обычные длинные предложения
        # Ищем: (Буквы минимум 2 шт) + (Точка) + (Пробел) + (Заглавная буква)
        # [а-яА-Я]{2} спасает от разрыва на сокращениях вроде "2014 г. №173" или "им. Ленина"
        sentence_pattern = r'(?<=[а-яёА-ЯЁa-zA-Z]{2}\.)\s+(?=[А-ЯЁA-Z])'
        raw_text = re.sub(sentence_pattern, r'\n', raw_text)

        # Шаг 4. Формируем финальные блоки
        lines = [line.strip() for line in raw_text.split('\n') if line.strip()]

        for line in lines:
            match = DocumentParser.STRUCTURAL_REGEX.match(line)
            block_id = match.group(0).strip() if match else None

            blocks.append(DocumentBlock(
                index=current_index,
                id=block_id,
                text=line,
                hash=DocumentBlock.generate_hash(line)
            ))
            current_index += 1

        return blocks