// src/utils/telegram.ts

// Получаем объект Telegram, игнорируя ошибки TypeScript
const tg = (window as any).Telegram?.WebApp;

// Экспортируем сам объект для доступа к кнопкам
export const getTg = () => tg;

// Функция для получения пользователя
const getUser = () => {
  if (tg?.initDataUnsafe?.user) {
    return {
      id: tg.initDataUnsafe.user.id,
      username:
        tg.initDataUnsafe.user.username || `user_${tg.initDataUnsafe.user.id}`,
      first_name: tg.initDataUnsafe.user.first_name || "User",
      photo_url: tg.initDataUnsafe.user.photo_url || null,
    };
  }
  return {
    id: 1234532131231,
    username: "demo_user",
    first_name: "Boris",
    photo_url: null,
  };
};

export const TELEGRAM_USER = getUser();

// --- НАТИВНЫЕ ФУНКЦИИ TELEGRAM ---

export const tgAlert = (message: string) => {
  if (tg && tg.showAlert) {
    tg.showAlert(message);
  } else {
    alert(message); // Фолбэк для браузера
  }
};

export const tgHaptic = (
  style: "light" | "medium" | "heavy" | "rigid" | "soft" = "light",
) => {
  if (tg && tg.HapticFeedback) {
    tg.HapticFeedback.impactOccurred(style);
  }
};

export const tgClose = () => {
  if (tg && tg.close) {
    tg.close();
  } else {
    console.log("Приложение закрыто (имитация для браузера)");
  }
};
