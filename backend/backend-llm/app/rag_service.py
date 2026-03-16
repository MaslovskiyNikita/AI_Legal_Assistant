import asyncio
import json
import logging
import pickle
from pathlib import Path
from typing import List, Dict, Optional

from langchain_classic.retrievers import EnsembleRetriever
from langchain_community.retrievers import BM25Retriever
from langchain_core.documents import Document
from langchain_huggingface import HuggingFaceEndpointEmbeddings
from langchain_postgres.vectorstores import PGVector

from settings import settings

logger = logging.getLogger(__name__)

class RagService:
    def __init__(self):
        if not settings.HF_TOKEN:
            logger.warning("HUGGINGFACEHUB_API_TOKEN не найден. RAG может не работать.")

        # 1. Эмбеддинги
        self.embeddings = HuggingFaceEndpointEmbeddings(
            model=settings.EMBEDDINGS_MODEL,
            huggingfacehub_api_token=settings.HF_TOKEN,
            task="feature-extraction",
        )

        # 2. Векторная база данных (PostgreSQL)
        self.vector_db = PGVector(
            connection=settings.PGVECTOR_URL,
            embeddings=self.embeddings,
            collection_name="legal_knowledge_base",
        )

        # 3. Загружаем статьи в память (нужно для BM25 и быстрого получения полных текстов)
        self._articles_cache: Dict[str, Document] = self._load_articles_to_cache()

        # 4. Инициализируем BM25 (с кэшированием индекса на диске)
        self.bm25_retriever = self._get_or_create_bm25_retriever()

        # 5. Создаем ансамбль (Гибридный поиск)
        retrievers = [self.vector_db.as_retriever(search_kwargs={"k": settings.TOP_K})]
        if self.bm25_retriever:
            retrievers.append(self.bm25_retriever)
            weights = [0.6, 0.4]
        else:
            weights = [1.0]

        self.ensemble_retriever = EnsembleRetriever(retrievers=retrievers, weights=weights)

    def _load_articles_to_cache(self) -> Dict[str, Document]:
        """Парсинг JSON файлов и создание словаря статей."""
        if not settings.DATA_DIR.exists():
            logger.error(f"Директория данных не найдена: {settings.DATA_DIR}")
            return {}

        cache = {}
        for file_path in settings.DATA_DIR.glob("*.json"):
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    articles_data = json.load(f)

                for entry in articles_data:
                    # Пропуск исключенных статей
                    if "исключена" in entry['text'].lower():
                        continue

                    doc_id = f"{entry['source']}_{entry['article_number']}"
                    cache[doc_id] = Document(
                        page_content=entry['text'],
                        metadata={
                            "article": entry['article_number'],
                            "section": entry.get('section', ''),
                            "source": entry['source']
                        }
                    )
            except Exception as e:
                logger.error(f"Ошибка при чтении файла {file_path}: {e}")

        logger.info(f"Загружено {len(cache)} статей в кэш.")
        return cache

    def _get_or_create_bm25_retriever(self) -> BM25Retriever:
        """Создает BM25 индекс или загружает его из файла pickle."""
        index_path = Path("bm25_index.pkl")

        if index_path.exists():
            try:
                with open(index_path, "rb") as f:
                    retriever = pickle.load(f)
                logger.info("Индекс BM25 успешно загружен из кэша (pickle).")
                return retriever
            except Exception as e:
                logger.error(f"Не удалось загрузить кэш BM25: {e}")

        # Если кэша нет или ошибка — создаем заново
        logger.info("Создание нового индекса BM25...")
        all_docs = list(self._articles_cache.values())

        if not all_docs:
            logger.warning("Нет документов для BM25. Индекс не создан.")
            return None

        retriever = BM25Retriever.from_documents(all_docs)
        retriever.k = settings.TOP_K

        # Сохраняем на диск
        try:
            with open(index_path, "wb") as f:
                pickle.dump(retriever, f)
        except Exception as e:
            logger.warning(f"Не удалось сохранить индекс BM25 на диск: {e}")

        return retriever

    def search(self, query: str, limit: int = settings.TOP_K) -> List[Document]:
        """
        Гибридный поиск. Возвращает полные тексты статей.
        """
        if not self._articles_cache:
            return []

        # EnsembleRetriever делает всю работу по гибридизации
        # Мы запрашиваем чуть больше, чтобы гарантированно отдать limit после маппинга
        raw_results = self.ensemble_retriever.invoke(query)

        seen_ids = set()
        final_docs = []

        for doc in raw_results:
            article_num = doc.metadata.get('article')
            source = doc.metadata.get('source')
            doc_id = f"{source}_{article_num}"

            if doc_id not in seen_ids and doc_id in self._articles_cache:
                seen_ids.add(doc_id)
                # Возвращаем полный текст из кэша
                final_docs.append(self._articles_cache[doc_id])

            if len(final_docs) >= limit:
                break

        return final_docs

    async def asearch(self, query: str, limit: int = settings.TOP_K) -> List[Document]:
        """Асинхронная версия поиска."""
        return await asyncio.to_thread(self.search, query, limit)


rag_service = RagService()