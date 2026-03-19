import json
import re
import httpx
import hashlib
from pathlib import Path
from bs4 import BeautifulSoup
from backend_llm.app.settings import settings


class PravoParser:
    def __init__(self, url: str, source_name: str):
        self.url = url
        self.source_name = source_name

        self.re_section = re.compile(r"^(РАЗДЕЛ\s+[IVXLCDM\d]+)(.*)", re.IGNORECASE)
        self.re_chapter = re.compile(r"^(ГЛАВА\s+\d+(?:\s*-\s*\d+)?)(.*)", re.IGNORECASE)
        self.re_article = re.compile(r"^Статья\s+(\d+(?:\s*-\s*\d+)?)\s*\.?(.*)", re.IGNORECASE)

        # Убедимся, что директория существует
        settings.DATA_DIR.mkdir(exist_ok=True)
        self.state_file = settings.DATA_DIR / "parsing_state.json"

    def fetch_html(self) -> str:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        print(f"Скачивание документа: {self.source_name} ...")
        with httpx.Client(verify=False) as client:
            response = client.get(self.url, headers=headers, timeout=30.0)
            response.raise_for_status()
            return response.text

    def _get_hash(self, content: str) -> str:
        """Возвращает MD5 хэш строки."""
        return hashlib.md5(content.encode('utf-8')).hexdigest()

    def _load_state(self) -> dict:
        """Загружает историю хэшей."""
        if self.state_file.exists():
            with open(self.state_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {}

    def _save_state(self, state: dict):
        """Сохраняет историю хэшей."""
        with open(self.state_file, 'w', encoding='utf-8') as f:
            json.dump(state, f, ensure_ascii=False, indent=2)

    def parse(self, html: str) -> list[dict]:
        soup = BeautifulSoup(html, "lxml")

        # 1. ПРЕПРОЦЕССИНГ HTML
        for sup in soup.find_all('sup'):
            sup_text = sup.get_text(strip=True)
            if sup_text:
                sup.replace_with(f"-{sup_text}")

        for tag in soup.find_all(['br', 'hr']):
            tag.replace_with('\n')
        for tag in soup.find_all(['p', 'div', 'h1', 'h2', 'h3', 'li']):
            tag.insert_before('\n')
            tag.insert_after('\n')

        text_content = soup.get_text()
        lines = [line.strip() for line in text_content.split('\n') if line.strip()]

        # Используем словарь вместо списка, чтобы реальный текст перезаписал оглавление!
        results_dict = {}

        current_section = ""
        current_chapter = ""
        current_article_number = None
        current_article_text = []

        is_expecting_section_name = False
        is_expecting_chapter_name = False
        skip_footnote = False  # Флаг для пропуска многострочных сносок

        def save_current_article():
            if current_article_number and current_article_text:
                full_text = " ".join(current_article_text).strip()
                # Сохраняем по номеру статьи. Если парсер идет по оглавлению - будет только заголовок.
                # Когда парсер дойдет до тела закона, он перезапишет запись полным текстом!
                results_dict[current_article_number] = {
                    "article_number": current_article_number,
                    "section": current_section,
                    "chapter": current_chapter,
                    "text": full_text,
                    "source": self.source_name
                }

        for line in lines:
            line = re.sub(r'\s+', ' ', line)

            # --- ИГНОР МУСОРА ---
            if line in ["Версия для печати", "Скачать", "Поделиться", "Сохранить"]:
                continue
            if re.match(r'^_{5,}$', line):
                continue

            # Обработка многострочных сносок
            if line.startswith('*Части статей') or line.startswith('*Пункт'):
                skip_footnote = True
                continue

            if skip_footnote:
                # Если видим, что началась реальная статья (цифра с точкой или слово "Статья") - выключаем игнор
                if re.match(r'^(\d+\.|Статья\s)', line, re.IGNORECASE):
                    skip_footnote = False
                else:
                    continue  # Продолжаем игнорировать строки сноски

            # --- ОБРАБОТКА РАЗДЕЛА ---
            match_sec = self.re_section.match(line)
            if match_sec:
                current_section = match_sec.group(1).strip()
                current_chapter = ""
                # lstrip('. ') уберет двойные точки, если они попали в remainder
                remainder = match_sec.group(2).strip().lstrip('. ')
                if remainder:
                    current_section += ". " + remainder
                else:
                    is_expecting_section_name = True
                continue

            if is_expecting_section_name:
                if not re.match(r"^(ГЛАВА|Статья)", line, re.IGNORECASE):
                    # И здесь убираем лишние точки перед склейкой
                    current_section += ". " + line.lstrip('. ')
                    is_expecting_section_name = False
                    continue
                else:
                    is_expecting_section_name = False

            # --- ОБРАБОТКА ГЛАВЫ ---
            match_chap = self.re_chapter.match(line)
            if match_chap:
                current_chapter = match_chap.group(1).strip()
                remainder = match_chap.group(2).strip().lstrip('. ')
                if remainder:
                    current_chapter += ". " + remainder
                else:
                    is_expecting_chapter_name = True
                continue

            if is_expecting_chapter_name:
                if not re.match(r"^(Статья|РАЗДЕЛ)", line, re.IGNORECASE):
                    current_chapter += ". " + line.lstrip('. ')
                    is_expecting_chapter_name = False
                    continue
                else:
                    is_expecting_chapter_name = False

            # --- ОБРАБОТКА СТАТЬИ ---
            match_article = self.re_article.match(line)
            if match_article:
                save_current_article()

                current_article_number = match_article.group(1).replace(" ", "")
                current_article_text = []

                remainder = match_article.group(2).strip().lstrip('. ')
                if remainder.endswith('*'):
                    remainder = remainder[:-1].strip()

                if remainder:
                    current_article_text.append(remainder)
                continue

            # --- ОБРАБОТКА ТЕКСТА СТАТЬИ ---
            if current_article_number:
                current_article_text.append(line)

        # Сохраняем последнюю статью
        save_current_article()

        # Возвращаем значения словаря обратно в виде списка
        return list(results_dict.values())

    def check_and_save(self):
        """Главный метод: проверяет изменения и сохраняет при необходимости."""
        # 1. Скачиваем HTML
        html = self.fetch_html()

        # 2. Вычисляем хэш текущего документа
        current_hash = self._get_hash(html)

        # 3. Сравниваем с сохраненным состоянием
        state = self._load_state()
        safe_name = "".join([c if c.isalnum() else "_" for c in self.source_name])

        if state.get(safe_name) == current_hash:
            print(f"⏩ Документ '{self.source_name}' не изменился. Пропускаем.")
            return

        print(f"🔄 Обнаружены изменения в '{self.source_name}' (или это первый запуск). Начинаем парсинг...")

        # 4. Парсим и сохраняем, так как есть изменения
        articles = self.parse(html)

        if not articles:
            print(f"❌ Ошибка: Не удалось найти статьи для {self.source_name}.")
            return

        file_path = settings.DATA_DIR / f"{safe_name}.json"

        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(articles, f, ensure_ascii=False, indent=2)

        # 5. Обновляем и сохраняем новое состояние
        state[safe_name] = current_hash
        self._save_state(state)

        print(f"✅ Успешно сохранено {len(articles)} статей в файл: {file_path.name}")


if __name__ == "__main__":
    import urllib3

    urllib3.disable_warnings()

    docs = [
        {
            "url": "https://pravo.by/pravovaya-informatsiya/normativnye-dokumenty/konstitutsiya-respubliki-belarus/",
            "name": "Конституция Республики Беларусь"
        },
        {
            "url": "https://pravo.by/document/?guid=3871&p0=Hk9900275",
            "name": "Уголовный кодекс Республики Беларусь"
        },
        {
            "url": "https://pravo.by/document/?guid=3871&p0=Hk9800218",
            "name": "Гражданский кодекс Республики Беларусь"
        },
        {
            "url": "https://pravo.by/document/?guid=3871&p0=HK9900296",
            "name": "Трудовой кодекс Республики Беларусь"
        }
    ]

    for doc in docs:
        parser = PravoParser(url=doc["url"], source_name=doc["name"])
        parser.check_and_save()