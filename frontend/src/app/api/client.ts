// app/api/client.ts
import * as mockApi from "../../mocks/mockApi";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true" || false;
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://0.0.0.0:8023";

const BASE_URL = `${API_BASE}/api/v1`;

export const apiClient = {
  // Отправить файлы на анализ и сравнение
  async compareDocuments(payload: { old_file: string; new_file: string }) {
    if (USE_MOCK) return mockApi.compareDocuments(payload);

    const response = await fetch(`${BASE_URL}/documents/compare`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`compareDocuments failed: ${response.status}`);
    }

    // Возвращает строку
    return response.json();
  },

  // Получить список диалогов юзера
  async getDialogues(userId: string) {
    if (USE_MOCK) return mockApi.getDialogues(userId);
    const response = await fetch(`${BASE_URL}/dialogues/${userId}`);
    return response.json();
  },

  // Auth endpoint
  async auth(payload: any) {
    if (USE_MOCK) {
      console.log("🟢 [MOCK API] Вызов POST /api/v1/auth с данными:", payload);
      const res = await mockApi.auth(payload);
      console.log("🟢 [MOCK API] Ответ от auth:", res);
      return res;
    }
    const r = await fetch(`${BASE_URL}/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!r.ok) throw new Error(`Auth failed: ${r.status}`);
    return r.json();
  },

  // Get user profile
  async getUser(telegram_id: number) {
    if (USE_MOCK) {
      console.log(`🟢 [MOCK API] Вызов GET /api/v1/users/${telegram_id}`);
      try {
        const res = await mockApi.getUser(telegram_id as any);
        console.log(
          "🟢 [MOCK API] Ответ от getUser (пользователь найден):",
          res,
        );
        return res;
      } catch (err) {
        console.log(
          "🔴 [MOCK API] Ошибка от getUser (пользователь НЕ найден, 404)",
        );
        throw err;
      }
    }
    const r = await fetch(`${BASE_URL}/users/${telegram_id}`);
    if (r.status === 404) {
      const body = await r.json().catch(() => ({ detail: "Not found" }));
      const err: any = new Error("User not found");
      err.status = 404;
      err.body = body;
      throw err;
    }
    if (!r.ok) throw new Error(`getUser failed: ${r.status}`);
    return r.json();
  },

  // Создать новый диалог
  async createChat(payload: { user_id: number; title?: string }) {
    if (USE_MOCK) return mockApi.createChat(payload);
    const r = await fetch(`${BASE_URL}/chats/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!r.ok) throw new Error(`createChat failed: ${r.status}`);
    return r.json();
  },

  // Получить список всех диалогов
  async getChats(user_id?: number) {
    if (USE_MOCK) return mockApi.getChats(user_id);
    const r = await fetch(`${BASE_URL}/chats/`);
    if (!r.ok) throw new Error(`getChats failed: ${r.status}`);
    return r.json();
  },

  // Получить один диалог по ID (с историей сообщений)
  async getChat(chat_id: number) {
    if (USE_MOCK) return mockApi.getChat(chat_id);
    const r = await fetch(`${BASE_URL}/chats/${chat_id}`);
    if (!r.ok) throw new Error(`getChat failed: ${r.status}`);
    return r.json();
  },

  // Отправить сообщение в чат с поддержкой потокового ответа (SSE)
  async sendMessageStream(
    chat_id: number,
    payload: { text: string; comparison_id?: number },
    onChunk: (chunk: string) => void,
  ) {
    if (USE_MOCK) {
      return mockApi.sendMessageStream(chat_id, payload, onChunk);
    }
    const r = await fetch(`${BASE_URL}/chats/${chat_id}/messages/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!r.ok || !r.body)
      throw new Error(`sendMessageStream failed: ${r.status}`);

    const reader = r.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value);
      // Обработка простого текста или Server-Sent Events формата
      onChunk(text);
    }
  },

  // загрузка файла в чат
  async uploadFileToChat(chat_id: number, filename: string) {
    if (USE_MOCK) return mockApi.uploadFileToChat(chat_id, filename);

    // предполагаем простой REST-эндпоинт для сохранения информации о файле в чате
    const r = await fetch(`${BASE_URL}/chats/${chat_id}/files`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename }),
    });
    if (!r.ok) {
      throw new Error(`uploadFileToChat failed: ${r.status}`);
    }
    return r.json().catch(() => undefined);
  },

  // Ping
  async ping() {
    if (USE_MOCK) return mockApi.ping();
    const r = await fetch(`${BASE_URL}/ping`);
    return r.json();
  },
};
