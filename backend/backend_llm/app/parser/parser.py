import re
from io import BytesIO
import fitz  # PyMuPDF
from docx import Document
from ..models import DocumentBlock
from docx.text.paragraph import Paragraph


class DocumentParser:
    # Улучшенная регулярка для отлова структуры юридических документов:
    # Берет: "Статья 1", "Глава I", "1.", "1.1.", "1)", "а)"
    STRUCTURAL_REGEX = re.compile(
        r"^(Статья\s+\d+|Глава\s+[IXV]+|\d+(\.\d+)*\.|[а-яА-Яa-zA-Z]\)|\d+\))(\s+|$)",
        re.IGNORECASE
    )

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
        # Теперь используем единый движок парсинга, чтобы не писать логику дважды
        blocks = cls.parse(file_stream)
        return "\n\n".join(b.text for b in blocks)

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
    def _parse_pdf(file_stream: BytesIO) -> list[DocumentBlock]:
        file_stream.seek(0)
        doc = fitz.open(stream=file_stream.read(), filetype="pdf")
        blocks_out = []
        current_index = 0

        visual_lines = []

        # ШАГ 1. Сбор строк с сохранением визуальных границ блоков
        for page in doc:
            text_blocks = page.get_text("blocks")
            # Сортировка блоков: сверху-вниз, слева-направо
            text_blocks.sort(key=lambda b: (b[1], b[0]))

            for b in text_blocks:
                if b[6] != 0:
                    continue  # Игнорируем изображения

                text = b[4].strip()
                if not text:
                    continue

                # Игнорируем одиночные номера страниц в колонтитулах
                if re.match(r'^\d+$', text):
                    continue

                # Убираем переносы слов (тире на стыке строк)
                text = re.sub(r'-\n\s*', '', text)
                lines = text.split('\n')

                for i, line in enumerate(lines):
                    clean_line = line.strip()
                    if clean_line:
                        # i == 0 означает, что это первая строка визуального блока PyMuPDF
                        visual_lines.append((clean_line, i == 0))

        # ШАГ 2. Умная сборка логических абзацев
        paragraphs = []
        current_para = ""

        for line, is_new_visual_block in visual_lines:
            is_structural = bool(DocumentParser.STRUCTURAL_REGEX.match(line))

            if not current_para:
                current_para = line
                continue

            # Проверяем, закончена ли мысль в предыдущей строке
            prev_ends_with_terminal = current_para.endswith(('.', ';', ':', '!', '?'))

            # Защита от сокращений, чтобы парсер не рвал текст после "2011 г." или "ул."
            is_abbrev = re.search(r'(г|им|ул|просп|д|кв|п|ст|обл)\.$', current_para.lower())
            if is_abbrev:
                prev_ends_with_terminal = False

            if is_structural:
                # 1. Жесткое правило: маркер (напр. "136.") = ГАРАНТИРОВАННО новый абзац
                paragraphs.append(current_para)
                current_para = line
            elif is_new_visual_block and prev_ends_with_terminal:
                # 2. Мягкое правило: Новый визуальный блок + мысль закончена точкой = новый абзац
                paragraphs.append(current_para)
                current_para = line
            else:
                # 3. Склеиваем: предложение разорвано страницей или это продолжение абзаца
                current_para += " " + line

        if current_para:
            paragraphs.append(current_para)

        # ШАГ 3. Формирование объектов DocumentBlock
        for para in paragraphs:
            # Финальная чистка лишних пробелов внутри абзаца
            para = re.sub(r'\s+', ' ', para).strip()
            if not para:
                continue

            match = DocumentParser.STRUCTURAL_REGEX.match(para)
            block_id = match.group(0).strip() if match else None

            blocks_out.append(DocumentBlock(
                index=current_index,
                id=block_id,
                text=para,
                hash=DocumentBlock.generate_hash(para)
            ))
            current_index += 1

        return blocks_out