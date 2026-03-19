import json
import hashlib
import psycopg2
from pathlib import Path

from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_postgres.vectorstores import PGVector
from langchain_core.documents import Document

from app.settings import settings
from backend_llm.app.embeddings import CustomGeminiEmbeddings

STATE_FILE = settings.DATA_DIR / "index_state.json"


def get_file_hash(file_path: Path) -> str:
    """Считает MD5 хеш файла для отслеживания изменений."""
    hasher = hashlib.md5()
    with open(file_path, 'rb') as f:
        buf = f.read()
        hasher.update(buf)
    return hasher.hexdigest()


def load_state() -> dict:
    """Загружает предыдущее состояние (хеши файлов)."""
    if STATE_FILE.exists():
        try:
            with open(STATE_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            return {}
    return {}


def save_state(state: dict):
    """Сохраняет текущее состояние (хеши файлов)."""
    with open(STATE_FILE, 'w', encoding='utf-8') as f:
        json.dump(state, f, ensure_ascii=False, indent=4)


def remove_old_vectors(file_name: str):
    """Удаляет старые векторы конкретного файла напрямую через SQL."""
    try:
        conn = psycopg2.connect(settings.PGVECTOR_URL)
        cur = conn.cursor()

        # Получаем ID коллекции
        cur.execute("SELECT uuid FROM langchain_pg_collection WHERE name = 'legal_knowledge_base'")
        res = cur.fetchone()

        if res:
            collection_id = res[0]
            # Удаляем только те записи, где в jsonb-метаданных _file_name совпадает с нашим
            cur.execute(
                "DELETE FROM langchain_pg_embedding WHERE collection_id = %s AND cmetadata->>'_file_name' = %s",
                (collection_id, file_name)
            )
            deleted_count = cur.rowcount
            if deleted_count > 0:
                print(f"   🗑️ Удалено {deleted_count} старых векторов для файла {file_name}")
            conn.commit()

        cur.close()
        conn.close()
    except Exception as e:
        print(f"   ❌ Ошибка при удалении старых векторов для {file_name}: {e}")


def build_index():
    embeddings = CustomGeminiEmbeddings()

    if not settings.DATA_DIR.exists():
        print(f"Ошибка: Папка {settings.DATA_DIR} не найдена!")
        return

    # Берем все JSON, кроме служебного файла с хешами
    json_files = [f for f in settings.DATA_DIR.glob("*.json") if f.name != "index_state.json"]

    if not json_files:
        print(f"В папке {settings.DATA_DIR} нет JSON файлов.")
        return

    state = load_state()
    files_to_process = []

    # 1. Сравниваем хеши файлов для определения изменений
    for file_path in json_files:
        file_hash = get_file_hash(file_path)
        if state.get(file_path.name) == file_hash:
            print(f"⏭️ Пропуск: {file_path.name} (без изменений)")
        else:
            files_to_process.append((file_path, file_hash))

    if not files_to_process:
        print("\n✅ Все файлы актуальны. Обновление индекса не требуется.")
        return

    print(f"\n🚀 К обновлению/добавлению: {len(files_to_process)} файлов.\n")

    # Инициализируем векторную БД (в режиме подключения к существующей)
    vector_db = PGVector(
        embeddings=embeddings,
        connection=settings.PGVECTOR_URL,
        collection_name="legal_knowledge_base",
        use_jsonb=True,
    )

    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)

    # 2. Обрабатываем только измененные/новые файлы
    for file_path, file_hash in files_to_process:
        print(f"🔄 Индексация файла: {file_path.name} ...")

        # Если файл был в стейте (т.е. это обновление, а не новый файл) — чистим старые векторы
        if file_path.name in state:
            remove_old_vectors(file_path.name)

        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        file_chunks = []
        for item in data:
            if "исключена" in item['text'].lower() or not item['text'].strip():
                continue

            full_text = (
                f"passage: {item['source']}. "
                f"Статья {item['article_number']}. "
                f"ст {item['article_number']}. "
                f"{item['article_number']}. "
                f"{item['text']}"
            )
            chunks = text_splitter.split_text(full_text)

            for chunk in chunks:
                file_chunks.append(Document(
                    page_content=chunk,
                    metadata={
                        "article": item['article_number'],
                        "section": item.get('section', ''),
                        "source": item['source'],
                        "_file_name": file_path.name  # <-- ДОБАВЛЕНО: для поиска при удалении
                    }
                ))

        if file_chunks:
            print(f"   📥 Отправка {len(file_chunks)} чанков в PostgreSQL (через Gemini API)...")
            vector_db.add_documents(file_chunks)
            print(f"   ✅ Файл {file_path.name} успешно загружен.")
        else:
            print(f"   ⚠️ В файле {file_path.name} не найдено подходящих для индексации текстов.")

        # Сохраняем стейт сразу после успеха для каждого файла,
        # чтобы в случае ошибки API не переиндексировать всё заново.
        state[file_path.name] = file_hash
        save_state(state)

    print("\n🎉 Инкрементальное обновление базы знаний завершено!")


if __name__ == "__main__":
    build_index()