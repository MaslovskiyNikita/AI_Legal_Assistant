// src/app/pages/Onboarding.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router"; // Убедись, что импорт из react-router-dom
import { apiClient } from "../api/client";
import { TELEGRAM_USER } from "../../utils/telegram";
import { Scale, Shield, FileText, ArrowRight, Loader2 } from "lucide-react";

export default function Onboarding() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // --- ВОТ ЛОГИКА ИЗ ТВОЕГО ПРИМЕРА, НО С УЛУЧШЕНИЕМ ---
  const handleStart = async () => {
    // Проверяем, есть ли вообще данные от Telegram
    if (!TELEGRAM_USER?.id) {
      alert(
        "Не удалось получить данные Telegram. Пожалуйста, перезапустите приложение.",
      );
      return;
    }

    setLoading(true);
    try {
      // 1. Сначала авторизуем или регистрируем пользователя на бэкенде.
      // Бэкенд сам разберется, новый это юзер или нет.
      await apiClient.auth({
        telegram_id: TELEGRAM_USER.id,
        username: TELEGRAM_USER.username || `user_${TELEGRAM_USER.id}`,
        first_name: TELEGRAM_USER.first_name || "User",
      });

      // 2. Затем получаем полный профиль пользователя (с его внутренним ID из БД).
      // Это ВАЖНЫЙ шаг, чтобы другие страницы работали корректно.
      const fullProfile = await apiClient.getUser(TELEGRAM_USER.id);

      // 3. Сохраняем ПОЛНОГО юзера, а не только данные из Telegram.
      localStorage.setItem("user", JSON.stringify(fullProfile));

      // 4. Отправляем в профиль.
      navigate("/profile", { replace: true });
    } catch (e) {
      console.error("Ошибка при старте и регистрации:", e);
      // Можно показать пользователю сообщение об ошибке
      alert("Произошла ошибка при входе. Попробуйте еще раз.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex flex-col justify-between bg-black p-8 font-sans overflow-hidden">
      {/* Свечение */}
      <div className="absolute -top-20 -left-20 w-[300px] h-[300px] bg-[#d946ef] rounded-full blur-[120px] opacity-20"></div>

      <div className="mt-16 flex flex-col items-center text-center z-10">
        <div className="w-24 h-24 bg-gradient-to-tr from-[#d946ef] to-[#a855f7] rounded-3xl flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(217,70,239,0.3)] rotate-3">
          <Scale size={48} color="white" />
        </div>

        <h1 className="text-white text-4xl font-bold mb-4 tracking-tight">
          Legal Expert AI
        </h1>
        <p className="text-white/60 text-[17px] leading-relaxed mb-12 max-w-[280px]">
          Ваш персональный юрист с искусственным интеллектом внутри Telegram.
        </p>

        <div className="w-full flex flex-col gap-6 text-left">
          <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
            <div className="p-3 bg-[#d946ef]/20 rounded-xl">
              <FileText size={24} color="#d946ef" />
            </div>
            <div>
              <p className="text-white font-semibold text-[17px]">
                Анализ документов
              </p>
              <p className="text-white/50 text-sm">
                Проверка контрактов и поиск рисков
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
            <div className="p-3 bg-[#a855f7]/20 rounded-xl">
              <Shield size={24} color="#a855f7" />
            </div>
            <div>
              <p className="text-white font-semibold text-[17px]">
                Безопасно и приватно
              </p>
              <p className="text-white/50 text-sm">
                Все данные строго конфиденциальны
              </p>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={handleStart}
        disabled={loading}
        className="w-full py-4 mb-4 rounded-2xl font-semibold text-[17px] text-white flex items-center justify-center gap-2 bg-gradient-to-r from-[#d946ef] to-[#a855f7] shadow-lg shadow-[#d946ef]/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="animate-spin" size={20} />
        ) : (
          <>
            Начать знакомство
            <ArrowRight size={20} />
          </>
        )}
      </button>
    </div>
  );
}
