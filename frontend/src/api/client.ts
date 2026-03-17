// src/api/client.ts

const BASE_URL = "https://legal-assistant-api.kawun.su/api/v1";

export const apiClient = {
  // Метод для сравнения (добавлены chatId и userId)
  async compareDocuments(
    chatId: number,
    userId: number,
    oldFile: File,
    newFile: File,
  ) {
    const formData = new FormData();
    formData.append("chat_id", chatId.toString());
    formData.append("user_id", userId.toString());
    formData.append("old_file", oldFile);
    formData.append("new_file", newFile);

    const response = await fetch(`${BASE_URL}/documents/compare`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`compareDocuments failed: ${response.status}`);
    }

    // Проверяем, в каком формате отвечает бэк (если JSON - парсим, иначе текст)
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    }
    return await response.text();
  },

  // Метод для скачивания документа (Адаптирован под Telegram)
  async downloadDocument(documentId: number, filename: string = "document") {
    const downloadUrl = `${BASE_URL}/documents/${documentId}/download`;

    // Проверяем, открыто ли приложение внутри Telegram
    // @ts-ignore
    if (window.Telegram?.WebApp?.initData) {
      // Отдаем ссылку самому Телеграму, он откроет её нативным загрузчиком iOS/Android
      // @ts-ignore
      window.Telegram.WebApp.openLink(downloadUrl);
      return;
    }

    // Фолбэк: если открыто просто в браузере Chrome/Safari на ПК
    const response = await fetch(downloadUrl);
    if (!response.ok) throw new Error("Download failed");

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  async auth(payload: any) {
    const r = await fetch(`${BASE_URL}/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!r.ok) throw new Error(`Auth failed: ${r.status}`);
    return r.json();
  },

  async getAllUserDocuments(user_id: number) {
    const r = await fetch(`${BASE_URL}/chats/${user_id}/all_documents`);
    if (!r.ok) throw new Error(`getAllUserDocuments failed: ${r.status}`);
    return r.json();
  },

  async getUser(telegram_id: number) {
    const r = await fetch(`${BASE_URL}/users/${telegram_id}`);
    if (r.status === 404) throw new Error("User not found");
    if (!r.ok) throw new Error(`getUser failed: ${r.status}`);
    return r.json();
  },

  async updateSettings(
    user_id: number,
    payload: { theme?: string; notifications_enabled?: boolean },
  ) {
    const r = await fetch(`${BASE_URL}/users/${user_id}/settings`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!r.ok) throw new Error(`updateSettings failed: ${r.status}`);
    return r.json();
  },

  async createChat(payload: { user_id: number; title?: string }) {
    const r = await fetch(`${BASE_URL}/chats/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!r.ok) throw new Error(`createChat failed: ${r.status}`);
    return r.json();
  },

  async getChats(user_id?: number) {
    const url =
      typeof user_id === "number"
        ? `${BASE_URL}/chats/?user_id=${user_id}`
        : `${BASE_URL}/chats/`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(`getChats failed: ${r.status}`);
    return r.json();
  },

  async getChat(chat_id: number) {
    const r = await fetch(`${BASE_URL}/chats/${chat_id}`);
    if (!r.ok) throw new Error(`getChat failed: ${r.status}`);
    return r.json();
  },

  async getChatDocuments(chat_id: number) {
    const r = await fetch(`${BASE_URL}/chats/${chat_id}/documents`);
    if (!r.ok) throw new Error(`getChatDocuments failed: ${r.status}`);
    return r.json();
  },

  // НОВЫЙ МЕТОД ДЛЯ УДАЛЕНИЯ ЧАТА
  async deleteAllChats(user_id: number) {
    const r = await fetch(`${BASE_URL}/chats/?user_id=${user_id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });
    if (!r.ok) {
      let errorDetail = `deleteAllChats failed: ${r.status}`;
      try {
        const errorData = await r.json();
        if (errorData.detail) errorDetail = errorData.detail;
      } catch (e) {}
      throw new Error(errorDetail);
    }
    return r.json();
  },

  async deleteChat(chat_id: number) {
    const r = await fetch(`${BASE_URL}/chats/${chat_id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });

    if (!r.ok) {
      // Пытаемся достать текст ошибки с бэкенда, если он есть
      let errorDetail = `deleteChat failed: ${r.status}`;
      try {
        const errorData = await r.json();
        if (errorData.detail) errorDetail = errorData.detail;
      } catch (e) {}
      throw new Error(errorDetail);
    }

    return r.json();
  },

  // src/api/client.ts (Метод sendMessageStream)
  async sendMessageStream(
    chat_id: number,
    payload: { text: string; comparison_id?: number },
    onChunk: (chunk: string) => void,
  ) {
    const r = await fetch(`${BASE_URL}/chats/${chat_id}/messages/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!r.ok || !r.body)
      throw new Error(`sendMessageStream failed: ${r.status}`);

    const reader = r.body.getReader();
    const decoder = new TextDecoder("utf-8");

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunkString = decoder.decode(value, { stream: true });
        const lines = chunkString.split("\n");

        for (const line of lines) {
          if (line.trim().startsWith("data:")) {
            const dataStr = line.replace("data:", "").trim();
            if (!dataStr || dataStr === "[DONE]") continue;

            try {
              const parsed = JSON.parse(dataStr);
              const textToAppend =
                parsed.chunk || parsed.content || parsed.text;
              if (textToAppend) {
                onChunk(textToAppend);
              } else if (typeof parsed === "string") {
                onChunk(parsed);
              }
            } catch (e) {
              onChunk(dataStr);
            }
          }
        }
      }
    } catch (streamError) {
      console.error("Stream reading interrupted:", streamError);
      throw new Error("Соединение прервано во время ожидания ответа.");
    } finally {
      // Обязательно освобождаем reader, если произошла ошибка
      reader.releaseLock();
    }
  },
};
