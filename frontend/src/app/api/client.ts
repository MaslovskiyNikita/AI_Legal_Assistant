const BASE_URL = "http://localhost:8023/api/v1";

export const apiClient = {
  // Отправить файлы на анализ и сравнение
  async compareDocuments(oldFile: File, newFile: File) {
    const formData = new FormData();
    formData.append("old_file", oldFile);
    formData.append("new_file", newFile);

    const response = await fetch(`${BASE_URL}/documents/compare`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`compareDocuments failed: ${response.status}`);
    }

    return await response.text();
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

  async getUser(telegram_id: number) {
    const r = await fetch(`${BASE_URL}/users/${telegram_id}`);
    if (r.status === 404) throw new Error("User not found");
    if (!r.ok) throw new Error(`getUser failed: ${r.status}`);
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

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // Декодируем кусок байтов в строку
      const chunkString = decoder.decode(value, { stream: true });

      // SSE формат отправляет данные разделенные переносом строки
      const lines = chunkString.split("\n");

      for (const line of lines) {
        // Ищем строчки, которые начинаются с 'data:'
        if (line.trim().startsWith("data:")) {
          const dataStr = line.replace("data:", "").trim();

          // Пропускаем пустые данные или маркеры окончания (если бэкенд шлет [DONE])
          if (!dataStr || dataStr === "[DONE]") continue;

          try {
            // Парсим JSON из строчки
            const parsed = JSON.parse(dataStr);

            // Если внутри есть поле chunk, передаем его на экран
            if (parsed.chunk) {
              onChunk(parsed.chunk);
            }

            // Поле {"done": true} можно игнорировать, цикл и так завершится,
            // когда поток закроется.
          } catch (e) {
            console.error("Ошибка при парсинге чанка:", dataStr, e);
          }
        }
      }
    }
  },
};
