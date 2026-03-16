// src/utils/telegram.ts

// Получаем объект Telegram, игнорируя ошибки TypeScript
const tg = (window as any).Telegram?.WebApp;

// Функция для получения пользователя
const getUser = () => {
  // Если мы открыты внутри Telegram
  if (tg?.initDataUnsafe?.user) {
    return {
      id: tg.initDataUnsafe.user.id,
      username:
        tg.initDataUnsafe.user.username || `user_${tg.initDataUnsafe.user.id}`,
      first_name: tg.initDataUnsafe.user.first_name || "User",
    };
  }

  // Фолбэк для тестов в браузере на ПК (вне Telegram)
  return {
    id: 1234532131231,
    username: "demo_user",
    first_name: "Boris",
  };
};

export const TELEGRAM_USER = getUser();
