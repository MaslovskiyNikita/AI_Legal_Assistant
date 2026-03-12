import React, { useState } from "react";
import { useNavigate } from "react-router";
import { apiClient } from "../api/client";
import { Scale, Shield, FileText } from "lucide-react";
import { TELEGRAM_USER } from "../../utils/telegram";

export default function Onboarding() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    try {
      setLoading(true);
      // Автоматически регистрируем юзера с данными, которые пришли
      const authRes = await apiClient.auth({
        telegram_id: TELEGRAM_USER.id,
        username: TELEGRAM_USER.username,
        first_name: TELEGRAM_USER.first_name,
      });
      // Сохраняем в localStorage
      localStorage.setItem(
        "user",
        JSON.stringify({
          telegram_id: TELEGRAM_USER.id,
          first_name: TELEGRAM_USER.first_name,
          username: TELEGRAM_USER.username,
        }),
      );
      // Отправляем в профиль
      navigate("/profile", { replace: true });
    } catch (e) {
      console.error("Ошибка при регистрации:", e);
      navigate("/profile", { replace: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex flex-col justify-between bg-[#1C1C1D] p-6">
      <div className="mt-12 flex flex-col items-center text-center">
        <div className="w-20 h-20 bg-[#3390EC]/20 rounded-full flex items-center justify-center mb-6">
          <Scale size={40} color="#3390EC" />
        </div>
        <h1 className="text-white text-3xl font-bold mb-3 tracking-tight">
          Legal Assistant
        </h1>
        <p className="text-[#8E8E93] text-[17px] leading-relaxed mb-10">
          Your personal AI lawyer right inside Telegram. Get instant help with
          documents and legal questions.
        </p>

        <div className="w-full flex flex-col gap-6 text-left">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#222225] rounded-xl">
              <FileText size={24} color="#3390EC" />
            </div>
            <div>
              <p className="text-white font-semibold text-[17px]">
                Analyze Documents
              </p>
              <p className="text-[#8E8E93] text-sm">
                Upload contracts and get summaries
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#222225] rounded-xl">
              <Shield size={24} color="#3390EC" />
            </div>
            <div>
              <p className="text-white font-semibold text-[17px]">
                Safe & Private
              </p>
              <p className="text-[#8E8E93] text-sm">
                Your data is strictly confidential
              </p>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={handleStart}
        disabled={loading}
        className="w-full py-4 mb-4 rounded-xl font-semibold text-[17px] text-white disabled:opacity-50 active:opacity-80 transition-opacity"
        style={{ backgroundColor: "#3390EC" }}
      >
        {loading ? "Starting..." : "Start Exploring"}
      </button>
    </div>
  );
}
