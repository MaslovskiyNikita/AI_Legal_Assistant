// frontend/src/mocks/mockApi.ts
export async function auth(payload: any) {
  // { "user_id": 0, "is_new_user": true }
  return new Promise((resolve) =>
    setTimeout(() => resolve({ user_id: 1, is_new_user: true }), 250),
  );
}

export async function getUser(telegram_id: number) {
  return new Promise((resolve, reject) =>
    setTimeout(() => {
      // Для демонстрации онбординга:
      // Если telegram_id равен 99999
      // то возвращаем ошибку "Пользователь не найден".
      if (telegram_id === 99999) {
        const err: any = new Error("Пользователь не найден");
        err.status = 404;
        err.response = { data: { detail: "Пользователь не найден" } };
        reject(err);
      } else {
        resolve({
          id: 1,
          telegram_id,
          username: "demo_user",
          first_name: "Boris",
          last_name: "Erzhanovich",
          photo_url:
            "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200&h=200",
          created_at: new Date().toISOString(),
          documents_analyzed: MOCK_DOCUMENTS_COUNT,
          consultations_count: 32,
        });
      }
    }, 200),
  );
}

export async function ping() {
  return new Promise((resolve) =>
    setTimeout(() => resolve({ status: "ok" }), 50),
  );
}

export async function compareDocuments(payload: {
  old_file: string;
  new_file: string;
}) {
  return new Promise((resolve) =>
    setTimeout(
      () =>
        resolve(
          "Моковый результат сравнения документов: В новой версии (статья 2) был изменен срок действия договора с 5 до 10 лет, а также добавлен пункт 4.1 об ответственности сторон.",
        ),
      800,
    ),
  );
}

export async function getDialogues(userId: string) {
  return new Promise((resolve) =>
    setTimeout(
      () =>
        resolve([
          {
            id: "1",
            title: "NDA Review - Apple Inc.",
            last_message: "Done",
            time: "12:30",
          },
          {
            id: "2",
            title: "Divorce proceeding laws",
            last_message: "See notes",
            time: "Yesterday",
          },
        ]),
      180,
    ),
  );
}

// Глобальная переменная для хранения моковых чатов в памяти (чтобы они не пропадали при переходах)
let MOCK_CHATS = [
  {
    id: 1,
    title: "NDA Review - Apple Inc.",
    updated_at: new Date(Date.now() - 3600000).toISOString(),
    last_message: "Here are the key points of the non-disclosure agreement...",
  },
  {
    id: 2,
    title: "Divorce proceeding laws",
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    last_message: "See notes",
  },
];

let MOCK_CHAT_MESSAGES: Record<number, any[]> = {
  1: [
    {
      id: 1,
      role: "user",
      content: "What are the key points of this NDA?",
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 2,
      role: "assistant",
      content: "Here are the key points of the non-disclosure agreement...",
      created_at: new Date(Date.now() - 3500000).toISOString(),
    },
  ],
};

// Глобальная переменная для хранения загруженных документов
let MOCK_DOCUMENTS_COUNT = 0;

export async function createChat(payload: { user_id: number; title?: string }) {
  return new Promise((resolve) =>
    setTimeout(() => {
      const newChatId = Math.floor(Math.random() * 1000) + 10;
      const newChat = {
        id: newChatId,
        title: payload.title || "Новый диалог",
        updated_at: new Date().toISOString(),
        last_message: "Новый диалог",
      };
      MOCK_CHAT_MESSAGES[newChatId] = [];
      MOCK_CHATS = [newChat, ...MOCK_CHATS];
      resolve(newChat);
    }, 250),
  );
}

export async function getChats(user_id?: number) {
  return new Promise((resolve) => setTimeout(() => resolve(MOCK_CHATS), 180));
}

export async function getChat(chat_id: number) {
  return new Promise((resolve) =>
    setTimeout(() => {
      const chat = MOCK_CHATS.find((c) => c.id === chat_id);
      resolve({
        id: chat_id,
        title: chat ? chat.title : "Новый диалог",
        created_at: chat ? chat.updated_at : new Date().toISOString(),
        messages: MOCK_CHAT_MESSAGES[chat_id] || [],
      });
    }, 200),
  );
}

export async function sendMessageStream(
  chat_id: number,
  payload: { text: string; comparison_id?: number },
  onChunk: (chunk: string) => void,
) {
  return new Promise<void>((resolve) => {
    // 1. Сохраняем сообщение пользователя в моковую базу
    if (!MOCK_CHAT_MESSAGES[chat_id]) MOCK_CHAT_MESSAGES[chat_id] = [];
    const alreadyExists = MOCK_CHAT_MESSAGES[chat_id].some(
      (msg) =>
        msg.role === "user" &&
        msg.content === payload.text &&
        Date.now() - new Date(msg.created_at).getTime() < 2000,
    );

    if (!alreadyExists) {
      MOCK_CHAT_MESSAGES[chat_id].push({
        id: Date.now(),
        role: "user",
        content: payload.text,
        created_at: new Date().toISOString(),
      });
    }

    const response =
      "This is a mocked stream response from the AI. It simulates typing word by word.";
    const words = response.split(" ");
    let i = 0;

    // 2. Симулируем стриминг
    const interval = setInterval(() => {
      if (i < words.length) {
        onChunk(words[i] + " ");
        i++;
      } else {
        clearInterval(interval);

        // 3. Сохраняем ответ ассистента в моковую базу, когда он дописался
        MOCK_CHAT_MESSAGES[chat_id].push({
          id: Date.now() + 1,
          role: "assistant",
          content: response,
          created_at: new Date().toISOString(),
        });

        // 4. Обновляем last_message и updated_at у самого чата в списке
        const chatIndex = MOCK_CHATS.findIndex((c) => c.id === chat_id);
        if (chatIndex !== -1) {
          MOCK_CHATS[chatIndex] = {
            ...MOCK_CHATS[chatIndex],
            updated_at: new Date().toISOString(),
            last_message: response,
          };
          // Сортируем так, чтобы обновленный чат всплыл наверх
          const updatedChat = MOCK_CHATS.splice(chatIndex, 1)[0];
          MOCK_CHATS.unshift(updatedChat);
        }

        resolve();
      }
    }, 100);
  });
}

// Моковая функция для симуляции сохранения файла в историю чата
export async function uploadFileToChat(chat_id: number, filename: string) {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      // Увеличиваем счетчик документов при каждой загрузке
      MOCK_DOCUMENTS_COUNT += 1;

      if (!MOCK_CHAT_MESSAGES[chat_id]) MOCK_CHAT_MESSAGES[chat_id] = [];

      // Сохраняем сообщение о файле
      MOCK_CHAT_MESSAGES[chat_id].push({
        id: Date.now(),
        role: "user",
        content: `📎 Загружен файл: ${filename}`,
        created_at: new Date().toISOString(),
      });

      // Сохраняем ответ ассистента на файл
      const response = `Я получил файл "${filename}". Хотите, чтобы я проанализировал его ключевые пункты или сравнил с другим документом?`;
      MOCK_CHAT_MESSAGES[chat_id].push({
        id: Date.now() + 1,
        role: "assistant",
        content: response,
        created_at: new Date().toISOString(),
      });

      // Обновляем сам чат
      const chatIndex = MOCK_CHATS.findIndex((c) => c.id === chat_id);
      if (chatIndex !== -1) {
        MOCK_CHATS[chatIndex] = {
          ...MOCK_CHATS[chatIndex],
          updated_at: new Date().toISOString(),
          last_message: response,
        };
        const updatedChat = MOCK_CHATS.splice(chatIndex, 1)[0];
        MOCK_CHATS.unshift(updatedChat);
      }

      resolve();
    }, 500);
  });
}

export default {
  auth,
  getUser,
  ping,
  compareDocuments,
  getDialogues,
  createChat,
  getChats,
  getChat,
  sendMessageStream,
  uploadFileToChat,
};
