import json
from langchain_huggingface import HuggingFaceEndpointEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_postgres.vectorstores import PGVector
from langchain_core.documents import Document
from app.settings import settings
from backend_llm.app.embeddings import CustomGeminiEmbeddings

def build_index():
    embeddings = CustomGeminiEmbeddings()

    if not settings.DATA_DIR.exists():
        print(f"Ошибка: Папка {settings.DATA_DIR} не найдена!")
        return

    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    all_chunks = []

    json_files = list(settings.DATA_DIR.glob("*.json"))

    if not json_files:
        print(f"В папке {settings.DATA_DIR} нет JSON файлов.")
        return

    for file_path in json_files:
        print(f"Обработка файла: {file_path.name}")
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

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
                all_chunks.append(Document(
                    page_content=chunk,
                    metadata={
                        "article": item['article_number'],
                        "section": item.get('section', ''),
                        "source": item['source']
                    }
                ))

    print(f"Всего собрано {len(all_chunks)} чанков. Отправка в Gemini API...")
    vector_db = PGVector.from_documents(
        embedding=embeddings,
        documents=all_chunks,
        connection=settings.PGVECTOR_URL,
        collection_name="legal_knowledge_base",
        use_jsonb=True,
    )
    print("Векторы успешно загружены в PostgreSQL!")


if __name__ == "__main__":
    build_index()