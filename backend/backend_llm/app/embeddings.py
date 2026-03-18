from typing import List

import requests
from backend_llm.app.settings import settings

class CustomGeminiEmbeddings:
    def embed_query(self, text: str) -> List[float]:
        url = f"{settings.GEMINI_BASE_URL}/v1beta/models/{settings.GEMINI_EMBEDDING_MODEL}:embedContent?key={settings.GEMINI_API_KEY}"
        payload = {"content": {"parts": [{"text": text}]}}
        response = requests.post(url, json=payload)

        # Добавляем вывод ошибки
        if not response.ok:
            print(f"Ошибка API (embed_query): {response.text}")

        response.raise_for_status()
        return response.json()["embedding"]["values"]

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        url = f"{settings.GEMINI_BASE_URL}/v1beta/models/{settings.GEMINI_EMBEDDING_MODEL}:batchEmbedContents?key={settings.GEMINI_API_KEY}"
        all_embeddings = []
        for i in range(0, len(texts), 100):
            batch = texts[i:i + 100]

            # ИЗМЕНЕНИЕ: Добавлено поле "model" внутри каждого объекта запроса (Gemini требует это для batch-запросов)
            payload = {
                "requests": [
                    {
                        "model": f"models/{settings.GEMINI_EMBEDDING_MODEL}",
                        "content": {"parts": [{"text": t}]}
                    }
                    for t in batch
                ]
            }

            response = requests.post(url, json=payload)

            # Добавляем вывод ошибки
            if not response.ok:
                print(f"Ошибка API (embed_documents): {response.text}")

            response.raise_for_status()
            all_embeddings.extend([emb["values"] for emb in response.json()["embeddings"]])
        return all_embeddings