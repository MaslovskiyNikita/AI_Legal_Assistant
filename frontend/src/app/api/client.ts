// app/api/client.ts
import * as mockApi from "../../mocks/mockApi";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true" || false;
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://0.0.0.0:8023";

const BASE_URL = `${API_BASE}/api/v1`;

export const apiClient = {
  // Отправить файлы на анализ
  async compareDocuments(files: File[]) {
    if (USE_MOCK) return mockApi.compareDocuments(files);
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    const response = await fetch(`${BASE_URL}/compare`, {
      method: "POST",
      body: formData,
    });
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

  // Ping
  async ping() {
    if (USE_MOCK) return mockApi.ping();
    const r = await fetch(`${BASE_URL}/v1/ping`);
    return r.json();
  },
};
