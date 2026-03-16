// src/utils/dateUtils.ts

export const formatDateLabel = (dateString: string | null | undefined) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return "Сегодня";
  } else if (date.toDateString() === yesterday.toDateString()) {
    return "Вчера";
  } else {
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
    });
  }
};

export const formatRecentDateShort = (
  dateString: string | null | undefined,
) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return "Сегодня";
  } else if (date.toDateString() === yesterday.toDateString()) {
    return "Вчера";
  }
  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
};
