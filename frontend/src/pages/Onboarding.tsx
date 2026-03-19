
import React, { useState } from "react";
import { useNavigate } from "react-router";
import { apiClient } from "../api/client";
import { TELEGRAM_USER, tgAlert } from "../utils/telegram"; 
import { Scale, Shield, FileText, Loader2 } from "lucide-react";

export default function Onboarding() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    if (!TELEGRAM_USER?.id) {
      tgAlert(
        "Не удалось получить данные Telegram. Пожалуйста, перезапустите приложение.",
      );
      return;
    }

    setLoading(true);
    try {
      await apiClient.auth({
        telegram_id: TELEGRAM_USER.id,
        username: TELEGRAM_USER.username || `user_${TELEGRAM_USER.id}`,
        first_name: TELEGRAM_USER.first_name || "User",
        photo_url: TELEGRAM_USER.photo_url,
      });
      const fullProfile = await apiClient.getUser(TELEGRAM_USER.id);
      localStorage.setItem("user", JSON.stringify(fullProfile));
      navigate("/profile", { replace: true });
    } catch (e) {
      console.error("Ошибка при старте и регистрации:", e);
      tgAlert("Произошла ошибка при входе. Попробуйте еще раз.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[var(--tg-theme-bg-color)] text-[var(--tg-theme-text-color)] flex flex-col justify-between p-6 font-sans">
      {}
      <div className="flex flex-col items-center text-center mt-16">
        {}
        <div className="w-24 h-24 bg-[color-mix(in_srgb,var(--tg-theme-button-color)_10%,transparent)] text-[var(--tg-theme-button-color)] rounded-full flex items-center justify-center mb-6 shadow-sm">
          <Scale size={48} className="text-[var(--tg-theme-button-color)]" />
        </div>

        <h1 className="text-[var(--tg-theme-text-color)] text-3xl font-bold mb-3 tracking-tight">
          Ваш AI-юрист в Telegram
        </h1>
        <p className="text-[var(--tg-theme-hint-color)] text-[17px] leading-relaxed mb-10 max-w-xs">
          Анализируйте документы, проверяйте договоры и получайте консультации.
        </p>

        {}
        <div className="w-full bg-[var(--tg-theme-bg-color)] rounded-2xl border border-[var(--tg-theme-section-separator-color,rgba(128,128,128,0.2))] overflow-hidden shadow-sm">
          {}
          <div className="flex items-center gap-4 p-4 border-b border-[var(--tg-theme-section-separator-color,rgba(128,128,128,0.2))]">
            <div className="w-10 h-10 flex-shrink-0 bg-[color-mix(in_srgb,var(--tg-theme-button-color)_10%,transparent)] text-[var(--tg-theme-button-color)] rounded-lg flex items-center justify-center">
              <FileText
                size={22}
                className="text-[var(--tg-theme-button-color)]"
              />
            </div>
            <div>
              <p className="text-[var(--tg-theme-text-color)] font-semibold text-[16px] text-left">
                Анализ документов
              </p>
              <p className="text-[var(--tg-theme-hint-color)] text-sm mt-0.5 text-left">
                Проверка контрактов и поиск рисков
              </p>
            </div>
          </div>

          {}
          <div className="flex items-center gap-4 p-4">
            <div className="w-10 h-10 flex-shrink-0 bg-[color-mix(in_srgb,var(--tg-theme-button-color)_10%,transparent)] text-[var(--tg-theme-button-color)] rounded-lg flex items-center justify-center">
              <Shield
                size={22}
                className="text-[var(--tg-theme-button-color)]"
              />
            </div>
            <div>
              <p className="text-[var(--tg-theme-text-color)] font-semibold text-[16px] text-left">
                Безопасно и приватно
              </p>
              <p className="text-[var(--tg-theme-hint-color)] text-sm mt-0.5 text-left">
                Все данные строго конфиденциальны
              </p>
            </div>
          </div>
        </div>
      </div>

      {}
      <button
        onClick={handleStart}
        disabled={loading}
        className="w-full py-4 mb-2 rounded-2xl font-semibold text-[17px] text-white flex items-center justify-center gap-2 bg-[var(--tg-theme-button-color)] shadow-md shadow-blue-500/30 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
      >
        {loading ? <Loader2 className="animate-spin" size={20} /> : "Начать"}
      </button>
    </div>
  );
}
