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

  // Применяем стили и к :root, и к <body>
  const elementsToUpdate = [document.documentElement, document.body];

  elementsToUpdate.forEach((el) => {
    if (theme === "dark") {
      el.style.setProperty("--tg-theme-bg-color", "#1c1c1d", "important");
      el.style.setProperty(
        "--tg-theme-secondary-bg-color",
        "#000000",
        "important",
      );
      el.style.setProperty("--tg-theme-text-color", "#ffffff", "important");
      el.style.setProperty("--tg-theme-hint-color", "#8e8e93", "important");
      el.style.setProperty("--tg-theme-button-color", "#3390ec", "important");
      el.style.setProperty(
        "--tg-theme-button-text-color",
        "#ffffff",
        "important",
      );
      el.style.setProperty(
        "--tg-theme-section-separator-color",
        "#38383a",
        "important",
      );

      // ПРИНУДИТЕЛЬНО задаем фон самого body, чтобы убрать белую полосу при скролле (overscroll)
      el.style.backgroundColor = "#1c1c1d";
    } else {
      el.style.setProperty("--tg-theme-bg-color", "#ffffff", "important");
      el.style.setProperty(
        "--tg-theme-secondary-bg-color",
        "#f2f2f7",
        "important",
      );
      el.style.setProperty("--tg-theme-text-color", "#000000", "important");
      el.style.setProperty("--tg-theme-hint-color", "#8e8e93", "important");
      el.style.setProperty("--tg-theme-button-color", "#3390ec", "important");
      el.style.setProperty(
        "--tg-theme-button-text-color",
        "#ffffff",
        "important",
      );
      el.style.setProperty(
        "--tg-theme-section-separator-color",
        "#e5e5ea",
        "important",
      );

      // ПРИНУДИТЕЛЬНО задаем фон самого body
      el.style.backgroundColor = "#ffffff";
    }
  });

  const tg = getTg();
  if (tg) {
    const bgColor = theme === "dark" ? "#1c1c1d" : "#ffffff";
    const secBgColor = theme === "dark" ? "#000000" : "#f2f2f7";

    try {
      // Красим фон самого WebApp
      if (tg.setBackgroundColor) tg.setBackgroundColor(bgColor);
      // Красим верхнюю панель
      if (tg.setHeaderColor) tg.setHeaderColor(secBgColor);

      // 👇 САМОЕ ВАЖНОЕ: Красим нижнюю системную панель (Bottom Bar) Telegram
      if (tg.setBottomBarColor) {
        // Зависит от дизайна, обычно нижняя панель сливается с основным фоном
        tg.setBottomBarColor(bgColor);
      }
    } catch (e) {
      console.warn("Telegram API не поддерживает смену цветов в этой версии");
    }
  }
};
