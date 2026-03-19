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
export const isTelegramWebApp = () => {
  return tg && tg.platform && tg.platform !== "unknown";
};

export const tgAlert = (message: string) => {
  if (tg && tg.showAlert) {
    tg.showAlert(message);
  } else {
    alert(message);
  }
};

// Обычный отклик (щелчок при нажатии на кнопки)
export const tgHaptic = (
  style: "light" | "medium" | "heavy" | "rigid" | "soft" = "light",
) => {
  // Читаем глобальную настройку
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  if (user && user.notifications_enabled === false) return; // Если выключено - отменяем вибрацию

  if (tg && tg.HapticFeedback) {
    tg.HapticFeedback.impactOccurred(style);
  }
};

// Отклик-уведомление (вибрация при успешном ответе или предупреждении)
export const tgHapticNotification = (type: "error" | "success" | "warning") => {
  // Читаем глобальную настройку
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  if (user && user.notifications_enabled === false) return; // Если выключено - отменяем вибрацию

  if (tg && tg.HapticFeedback) {
    tg.HapticFeedback.notificationOccurred(type);
  }
};

export const tgClose = () => {
  if (tg && tg.close) {
    tg.close();
  } else {
    console.log("Приложение закрыто (имитация для браузера)");
  }
};

export const tgOpenInvoice = (
  url: string,
  callback: (status: "paid" | "cancelled" | "failed" | "pending") => void,
) => {
  if (tg && tg.openInvoice) {
    tg.openInvoice(url, callback);
  } else {
    console.log("Открытие инвойса в браузере:", url);
    setTimeout(() => callback("paid"), 2000);
  }
};

export const applyThemeToApp = (theme: "light" | "dark") => {
  document.documentElement.setAttribute("data-theme", theme);

  // ЖЕСТКО переопределяем переменные, чтобы Telegram не навязывал свои цвета
  const root = document.documentElement;
  if (theme === "dark") {
    root.style.setProperty("--tg-theme-bg-color", "#1c1c1d");
    root.style.setProperty("--tg-theme-secondary-bg-color", "#000000");
    root.style.setProperty("--tg-theme-text-color", "#ffffff");
    root.style.setProperty("--tg-theme-hint-color", "#8e8e93");
    root.style.setProperty("--tg-theme-button-color", "#3390ec");
    root.style.setProperty("--tg-theme-button-text-color", "#ffffff");
    root.style.setProperty("--tg-theme-section-separator-color", "#38383a");
  } else {
    root.style.setProperty("--tg-theme-bg-color", "#ffffff");
    root.style.setProperty("--tg-theme-secondary-bg-color", "#f2f2f7");
    root.style.setProperty("--tg-theme-text-color", "#000000");
    root.style.setProperty("--tg-theme-hint-color", "#8e8e93");
    root.style.setProperty("--tg-theme-button-color", "#3390ec");
    root.style.setProperty("--tg-theme-button-text-color", "#ffffff");
    root.style.setProperty("--tg-theme-section-separator-color", "#e5e5ea");
  }

  const tg = getTg();
  if (tg) {
    const bgColor = theme === "dark" ? "#1c1c1d" : "#ffffff";
    const secBgColor = theme === "dark" ? "#000000" : "#f2f2f7";

    try {
      if (tg.setBackgroundColor) tg.setBackgroundColor(bgColor);
      if (tg.setHeaderColor) tg.setHeaderColor(secBgColor);
    } catch (e) {
      console.warn("Telegram API не поддерживает смену цветов в этой версии");
    }
  }
};
