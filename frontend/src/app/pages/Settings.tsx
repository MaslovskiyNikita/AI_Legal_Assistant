// src/app/pages/Settings.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router";
import {
  ChevronLeft,
  Trash2,
  Bell,
  Moon,
  Info,
  ShieldCheck,
  LogOut,
  Loader2, // <-- Иконка загрузки
} from "lucide-react";
import { apiClient } from "../api/client";

export default function Settings() {
  const navigate = useNavigate();

  // Достаем ID пользователя из локального хранилища
  const userStr = localStorage.getItem("user");
  const internalUserId = userStr ? JSON.parse(userStr).id : null;

  // Стейты для модалки и процесса удаления
  const [isClearHistoryModalOpen, setIsClearHistoryModalOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/", { replace: true });
  };

  // --- Логика очистки всей истории ---
  const executeClearHistory = async () => {
    if (!internalUserId) return;
    setIsClearing(true);

    try {
      // 1. Получаем все чаты пользователя
      const chats = await apiClient.getChats(internalUserId);

      // 2. Если чаты есть, удаляем их все параллельно
      if (chats && chats.length > 0) {
        const deletePromises = chats.map((chat: any) =>
          apiClient.deleteChat(chat.id),
        );
        await Promise.all(deletePromises);
      }

      // Закрываем модалку после успешного удаления
      setIsClearHistoryModalOpen(false);

      // Можно показать алерт или toast, что всё прошло успешно
      // alert("История чатов успешно очищена!");
    } catch (error) {
      console.error("Failed to clear history", error);
      alert("Не удалось очистить историю. Пожалуйста, попробуйте еще раз.");
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#1C1C1D] text-white flex flex-col pb-10 relative">
      {/* Header */}
      <div className="h-14 px-3 flex items-center border-b border-white/5 sticky top-0 bg-[#1C1C1D]/90 backdrop-blur-md z-10">
        <button
          onClick={() => navigate("/profile")}
          className="text-white p-1 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
        >
          <ChevronLeft size={28} />
        </button>
        <h2 className="ml-2 text-[17px] font-semibold">Settings</h2>
      </div>

      <div className="p-4 space-y-6">
        {/* Раздел: General */}
        <section>
          <h3 className="text-[#8E8E93] text-[13px] font-semibold uppercase tracking-wider ml-2 mb-2">
            General
          </h3>
          <div className="bg-[#2C2C2E] rounded-2xl overflow-hidden border border-white/5">
            <div className="flex items-center justify-between px-4 py-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <Moon size={20} className="text-white" />
                <span>Dark Mode</span>
              </div>
              <div className="w-10 h-6 bg-[#3390EC] rounded-full relative cursor-pointer">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
              </div>
            </div>
            <div className="flex items-center justify-between px-4 py-4">
              <div className="flex items-center gap-3">
                <Bell size={20} className="text-white" />
                <span>Notifications</span>
              </div>
              <div className="w-10 h-6 bg-[#3A3A3C] rounded-full relative cursor-pointer">
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full" />
              </div>
            </div>
          </div>
        </section>

        {/* Раздел: Data */}
        <section>
          <h3 className="text-[#8E8E93] text-[13px] font-semibold uppercase tracking-wider ml-2 mb-2">
            Data & Privacy
          </h3>
          <div className="bg-[#2C2C2E] rounded-2xl overflow-hidden border border-white/5">
            <button
              onClick={() => setIsClearHistoryModalOpen(true)}
              className="w-full flex items-center justify-between px-4 py-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-3 text-red-500">
                <Trash2 size={20} />
                <span>Clear All Chat History</span>
              </div>
            </button>
            <button className="w-full flex items-center justify-between px-4 py-4 hover:bg-white/5 transition-colors cursor-pointer text-left">
              <div className="flex items-center gap-3 text-white">
                <ShieldCheck size={20} />
                <span>Privacy Policy</span>
              </div>
            </button>
          </div>
        </section>

        {/* Раздел: About */}
        <section>
          <div className="bg-[#2C2C2E] rounded-2xl overflow-hidden border border-white/5">
            <button className="w-full flex items-center justify-between px-4 py-4 hover:bg-white/5 transition-colors cursor-pointer text-left">
              <div className="flex items-center gap-3 text-white">
                <Info size={20} />
                <span>About Legal Expert AI</span>
              </div>
            </button>
          </div>
        </section>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full py-4 text-red-500 font-medium bg-[#2C2C2E] rounded-2xl border border-red-500/10 hover:bg-red-500/10 transition-colors cursor-pointer flex items-center justify-center gap-2"
        >
          <LogOut size={20} />
          Sign Out
        </button>
      </div>

      {/* --- КАСТОМНАЯ МОДАЛКА ОЧИСТКИ ИСТОРИИ --- */}
      {isClearHistoryModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-[#2C2C2E] rounded-2xl p-6 w-full max-w-xs border border-white/10 shadow-lg flex flex-col items-center text-center animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
              <Trash2 size={24} className="text-[#FF3B30]" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">
              Clear All History
            </h2>
            <p className="text-[14px] text-gray-400 mb-6">
              Вы уверены, что хотите удалить <b>все</b> свои консультации и
              документы? Это действие нельзя будет отменить.
            </p>
            <div className="flex w-full gap-3">
              <button
                onClick={() => setIsClearHistoryModalOpen(false)}
                disabled={isClearing}
                className="flex-1 py-2.5 rounded-xl font-medium bg-[#3A3A3C] text-white hover:bg-[#4A4A4C] transition-colors cursor-pointer disabled:opacity-50"
              >
                Отмена
              </button>
              <button
                onClick={executeClearHistory}
                disabled={isClearing}
                className="flex-1 py-2.5 rounded-xl font-medium bg-[#FF3B30] text-white hover:bg-red-600 transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isClearing ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Очистка...
                  </>
                ) : (
                  "Удалить всё"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
