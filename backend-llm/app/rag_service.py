import json
import logging
from langchain_community.retrievers import BM25Retriever
from langchain_core.documents import Document
from langchain_huggingface import HuggingFaceEndpointEmbeddings
from langchain_postgres.vectorstores import PGVector

from .settings import settings

logger = logging.getLogger(__name__)


class RagService:
    def __init__(self):
        if not settings.HF_TOKEN:
            logger.warning("HUGGINGFACEHUB_API_TOKEN не найден. RAG может не работать.")

        self.embeddings = HuggingFaceEndpointEmbeddings(
            model=settings.EMBEDDINGS_MODEL,
            huggingfacehub_api_token=settings.HF_TOKEN,
            task="feature-extraction",
        )

        self.vector_db = PGVector(
            connection=settings.PGVECTOR_URL,
            embeddings=self.embeddings,
            collection_name="legal_knowledge_base",
        )

        self.full_articles = self._load_full_articles()
        self.bm25 = self._init_bm25()

    def _load_full_articles(self):
        if not settings.DATA_DIR.exists():
            return {}

        article_map = {}
        for file_path in settings.DATA_DIR.glob("*.json"):
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)

                for item in data:
                    if "исключена" in item['text'].lower():
                        continue

                    key = f"{item['source']}_{item['article_number']}"

                    article_map[key] = Document(
                        page_content=item['text'],
                        metadata={
                            "article": item['article_number'],
                            "section": item.get('section', ''),
                            "source": item['source']
                        }
                    )
            except Exception as e:
                logger.error(f"Ошибка при чтении {file_path}: {e}")

        return article_map

    def _init_bm25(self):
        if not self.full_articles:
            return None
        docs = list(self.full_articles.values())
        retriever = BM25Retriever.from_documents(docs)
        retriever.k = settings.TOP_K
        return retriever

    def search(self, query: str):
        if not self.vector_db or not self.bm25:
            return []

        faiss_chunks = self.vector_db.similarity_search(
            f"query: {query}",
            k=settings.TOP_K * 2
        )
        bm25_docs = self.bm25.invoke(query)

        found_keys = set()
        for chunk in faiss_chunks:
            found_keys.add(f"{chunk.metadata['source']}_{chunk.metadata['article']}")

        for doc in bm25_docs:
            found_keys.add(f"{doc.metadata['source']}_{doc.metadata['article']}")

        final_docs = []
        for key in found_keys:
            if key in self.full_articles:
                final_docs.append(self.full_articles[key])

        return final_docs


rag_service = RagService()