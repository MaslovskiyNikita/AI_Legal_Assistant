// src/app/pages/Settings.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  ChevronLeft,
  Trash2,
  Bell,
  Moon,
  Info,
  ShieldCheck,
  LogOut,
  Loader2,
  User,
  MessageSquare,
  CalendarDays,
  ChevronRight,
  Clock,
  Layers,
  FileText,
} from "lucide-react";
import { apiClient } from "../api/client";

export default function Settings() {
  const navigate = useNavigate();

  // Достаем данные пользователя
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const internalUserId = user?.id || null;
  const firstName = user?.first_name || "Пользователь";
  const username = user?.username ? `@${user.username}` : "Telegram ID скрыт";

  // Стейты
  const [isClearHistoryModalOpen, setIsClearHistoryModalOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Стейты для истории и статистики
  const [chats, setChats] = useState<any[]>([]);
  const [documentsCount, setDocumentsCount] = useState<number>(0);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [theme, setTheme] = useState(user?.theme || "dark");
  const [notifications, setNotifications] = useState(user?.notifications_enabled ?? true);

  // null = Показать все чаты. Date = фильтр по конкретному дню
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showAllChats, setShowAllChats] = useState(false);

  // Универсальная функция получения даты
  const getChatDateStr = (chat: any) =>
    chat.created_at || chat.createdAt || chat.updated_at || null;

  // Загрузка истории чатов и количества документов
  useEffect(() => {
    if (internalUserId) {
      apiClient
        .getChats(internalUserId)
        .then(async (data) => {
          // Сортируем чаты от новых к старым
          const sorted = (data || []).sort((a: any, b: any) => {
            const dateA = getChatDateStr(a);
            const dateB = getChatDateStr(b);
            if (!dateA) return 1;
            if (!dateB) return -1;
            return new Date(dateB).getTime() - new Date(dateA).getTime();
          });
          setChats(sorted);

          // Считаем документы со всех чатов пользователя
          let totalDocs = 0;
          try {
            const docsPromises = sorted.map((chat: any) =>
              apiClient.getChatDocuments(chat.id),
            );
            const docsResults = await Promise.allSettled(docsPromises);

            docsResults.forEach((result) => {
              if (result.status === "fulfilled" && result.value) {
                totalDocs += result.value.length;
              }
            });
          } catch (err) {
            console.error("Ошибка при подсчете документов", err);
          }
          setDocumentsCount(totalDocs);
        })
        .catch((err) => console.error("Ошибка загрузки чатов", err))
        .finally(() => setIsLoadingStats(false));
    } else {
      setIsLoadingStats(false);
    }
  }, [internalUserId]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/", { replace: true });
  };

  const executeClearHistory = async () => {
    if (!internalUserId) return;
    setIsClearing(true);
    try {
      if (chats.length > 0) {
        await apiClient.deleteAllChats(internalUserId);
        setChats([]);
        setDocumentsCount(0); // Сбрасываем и счетчик документов
      }
      setIsClearHistoryModalOpen(false);
    } catch (error) {
      console.error("Failed to clear history", error);
      alert("Не удалось очистить историю. Пожалуйста, попробуйте еще раз.");
    } finally {
      setIsClearing(false);
    }
  };

  const toggleTheme = async () => {
    if (!internalUserId) return;
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    try {
      const updatedUser = await apiClient.updateSettings(internalUserId, { theme: newTheme });
      localStorage.setItem("user", JSON.stringify(updatedUser));
    } catch (error) {
      console.error("Failed to update theme", error);
      setTheme(theme);
    }
  };

  const toggleNotifications = async () => {
    if (!internalUserId) return;
    const newNotifications = !notifications;
    setNotifications(newNotifications);
    try {
      const updatedUser = await apiClient.updateSettings(internalUserId, { notifications_enabled: newNotifications });
      localStorage.setItem("user", JSON.stringify(updatedUser));
    } catch (error) {
      console.error("Failed to update notifications", error);
      setNotifications(notifications);
    }
  };

  // Генерация последних 7 дней для мини-календаря
  const generateLast7Days = () => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - (6 - i));
      return d;
    });
  };
  const weekDays = generateLast7Days();

  // Форматирование даты
  const getDayName = (date: Date) =>
    date.toLocaleDateString("ru-RU", { weekday: "short" });
  const getDayNumber = (date: Date) => date.getDate();

  // Фильтрация
  const filteredChats = selectedDate
    ? chats.filter((chat) => {
        const dateStr = getChatDateStr(chat);
        if (!dateStr) return false;

        const chatDate = new Date(dateStr);
        return (
          chatDate.getFullYear() === selectedDate.getFullYear() &&
          chatDate.getMonth() === selectedDate.getMonth() &&
          chatDate.getDate() === selectedDate.getDate()
        );
      })
    : chats;

  const displayedChats = showAllChats
    ? filteredChats
    : filteredChats.slice(0, 5);

  return (
    <div className="min-h-screen w-full bg-black text-white flex flex-col pb-10 relative font-sans overflow-x-hidden">
      {/* Фоновое пурпурное свечение */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-[400px] bg-gradient-to-b from-[#24A1DE]/20 via-[#24A1DE]/5 to-transparent blur-[80px] pointer-events-none z-0"></div>

      {/* Header */}
      <div className="h-16 px-4 flex items-center border-b border-white/5 sticky top-0 bg-black/40 backdrop-blur-xl z-20">
        <button
          onClick={() => navigate("/profile")}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors cursor-pointer"
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="ml-3 text-[17px] font-medium text-white/90">Профиль</h2>
      </div>

      <div className="p-5 flex-1 z-10 relative space-y-8">
        {/* Карточка профиля */}
        <div className="flex flex-col items-center justify-center pt-2">
          {/* Аватарка: градиент изменен на 100% фиолетовый/маджентовый */}
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#24A1DE] to-[#24A1DE] p-[3px] mb-4 shadow-[0_0_30px_rgba(36,161,222,0.3)]">
            <div className="w-full h-full bg-[#1C1C1D] rounded-full flex items-center justify-center">
              <User size={40} className="text-[#24A1DE]" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">{firstName}</h1>
          <p className="text-[15px] text-white/50 mb-6">{username}</p>

          {/* --- БЛОК СТАТИСТИКИ (Чаты + Документы) --- */}
          <div className="w-full flex gap-3">
            {/* Карточка 1: Консультации */}
            <div className="flex-1 bg-[#1C1C1D] border border-white/5 rounded-3xl p-4 flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-[#24A1DE]/10 blur-[20px] rounded-full"></div>
              <MessageSquare size={20} className="text-[#24A1DE] mb-2" />
              <span className="text-2xl font-bold text-white mb-0.5">
                {isLoadingStats ? (
                  <Loader2 size={24} className="animate-spin text-white/30" />
                ) : (
                  chats.length
                )}
              </span>
              <span className="text-[12px] text-white/50 uppercase font-medium tracking-wide">
                Консультаций
              </span>
            </div>

            {/* Карточка 2: Документы (Синий изменен на пурпурный) */}
            <div className="flex-1 bg-[#1C1C1D] border border-white/5 rounded-3xl p-4 flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-[#24A1DE]/10 blur-[20px] rounded-full"></div>
              <FileText size={20} className="text-[#24A1DE] mb-2" />
              <span className="text-2xl font-bold text-white mb-0.5">
                {isLoadingStats ? (
                  <Loader2 size={24} className="animate-spin text-white/30" />
                ) : (
                  documentsCount
                )}
              </span>
              <span className="text-[12px] text-white/50 uppercase font-medium tracking-wide">
                Документов
              </span>
            </div>
          </div>
        </div>

        {/* --- СЕКЦИЯ: КАЛЕНДАРЬ И ИСТОРИЯ ЧАТОВ --- */}
        <section>
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2 text-white/90">
              <CalendarDays size={20} className="text-[#24A1DE]" />
              <h3 className="text-[16px] font-semibold">История запросов</h3>
            </div>
            <span className="text-[13px] text-white/40 bg-white/5 px-2 py-1 rounded-lg">
              {filteredChats.length} чатов
            </span>
          </div>

          {/* Горизонтальный мини-календарь */}
          <div className="flex gap-2 overflow-x-auto pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {/* Кнопка "Все" */}
            <button
              onClick={() => {
                setSelectedDate(null);
                setShowAllChats(false);
              }}
              className={`flex flex-col items-center justify-center min-w-[56px] h-[70px] rounded-2xl border transition-all cursor-pointer shrink-0 ${
                selectedDate === null
                  ? "bg-[#24A1DE] border-[#24A1DE] text-white shadow-[0_0_15px_rgba(36,161,222,0.4)]"
                  : "bg-[#1C1C1D] border-white/5 text-white/60 hover:bg-[#2C2C2E]"
              }`}
            >
              <span
                className={`text-[12px] uppercase font-medium mb-1 ${selectedDate === null ? "text-white/80" : "text-white/40"}`}
              >
                Все
              </span>
              <span
                className={`flex items-center justify-center ${selectedDate === null ? "text-white" : "text-white/90"}`}
              >
                <Layers size={20} />
              </span>
            </button>

            {/* Дни недели */}
            {weekDays.map((date, idx) => {
              const isSelected =
                selectedDate &&
                date.getFullYear() === selectedDate.getFullYear() &&
                date.getMonth() === selectedDate.getMonth() &&
                date.getDate() === selectedDate.getDate();

              return (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedDate(date);
                    setShowAllChats(false);
                  }}
                  className={`flex flex-col items-center justify-center min-w-[56px] h-[70px] rounded-2xl border transition-all cursor-pointer shrink-0 ${
                    isSelected
                      ? "bg-[#24A1DE] border-[#24A1DE] text-white shadow-[0_0_15px_rgba(36,161,222,0.4)]"
                      : "bg-[#1C1C1D] border-white/5 text-white/60 hover:bg-[#2C2C2E]"
                  }`}
                >
                  <span
                    className={`text-[12px] uppercase font-medium mb-1 ${isSelected ? "text-white/80" : "text-white/40"}`}
                  >
                    {getDayName(date)}
                  </span>
                  <span
                    className={`text-[18px] font-bold ${isSelected ? "text-white" : "text-white/90"}`}
                  >
                    {getDayNumber(date)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Список чатов */}
          <div className="bg-[#1C1C1D] rounded-3xl border border-white/5 overflow-hidden flex flex-col min-h-[120px]">
            {isLoadingStats ? (
              <div className="flex-1 flex items-center justify-center py-8">
                <Loader2 size={24} className="animate-spin text-[#24A1DE]" />
              </div>
            ) : chats.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-8 text-center px-4">
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-3">
                  <Clock size={24} className="text-white/30" />
                </div>
                <p className="text-white/60 text-[14px]">
                  У вас пока нет сохраненных консультаций
                </p>
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-8 text-center px-4">
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-3">
                  <CalendarDays size={24} className="text-white/30" />
                </div>
                <p className="text-white/60 text-[14px]">
                  Нет консультаций за эту дату
                </p>
              </div>
            ) : (
              <>
                {displayedChats.map((chat: any) => {
                  const dateStr = getChatDateStr(chat);
                  const displayDate = dateStr
                    ? new Date(dateStr).toLocaleDateString("ru-RU", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Неизвестная дата";

                  return (
                    <button
                      key={chat.id}
                      onClick={() => navigate(`/chat/${chat.id}`)}
                      className="w-full flex items-center justify-between px-5 py-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer text-left last:border-0"
                    >
                      <div className="flex items-center gap-4 overflow-hidden pr-4">
                        <div className="w-10 h-10 rounded-full bg-[#24A1DE]/10 flex items-center justify-center shrink-0">
                          <MessageSquare size={18} className="text-[#24A1DE]" />
                        </div>
                        <div className="flex flex-col overflow-hidden">
                          <span className="font-medium text-[15px] text-white/90 truncate">
                            {chat.title || "Новая консультация"}
                          </span>
                          <span className="text-[12px] text-white/40 mt-0.5">
                            {displayDate}
                          </span>
                        </div>
                      </div>
                      <ChevronRight
                        size={18}
                        className="text-white/30 shrink-0"
                      />
                    </button>
                  );
                })}

                {filteredChats.length > 5 && (
                  <button
                    onClick={() => setShowAllChats(!showAllChats)}
                    className="w-full py-3 text-[13px] font-medium text-[#24A1DE] hover:bg-white/5 transition-colors cursor-pointer border-t border-white/5"
                  >
                    {showAllChats
                      ? "Скрыть"
                      : `Показать все (${filteredChats.length})`}
                  </button>
                )}
              </>
            )}
          </div>
        </section>

        {/* --- Раздел: Основные --- */}
        <section>
          <h3 className="text-white/40 text-[13px] font-semibold uppercase tracking-wider ml-4 mb-2">
            Основные
          </h3>
          <div className="bg-[#1C1C1D] rounded-3xl border border-white/5 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <div className="flex items-center gap-4 text-white/90">
                <Moon size={20} className="text-[#24A1DE]" />
                <span className="font-medium text-[15px]">Темная тема</span>
              </div>
              <div 
                onClick={toggleTheme}
                className={`w-12 h-7 rounded-full relative cursor-pointer transition-colors ${theme === 'dark' ? 'bg-[#24A1DE] shadow-[0_0_10px_rgba(36,161,222,0.3)]' : 'bg-white/10'}`}
              >
                <div className={`absolute top-1 w-5 h-5 rounded-full shadow-sm transition-all ${theme === 'dark' ? 'right-1 bg-white' : 'left-1 bg-white/50'}`} />
              </div>
            </div>
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-4 text-white/90">
                <Bell size={20} className="text-white/50" />
                <span className="font-medium text-[15px]">Уведомления</span>
              </div>
              <div 
                onClick={toggleNotifications}
                className={`w-12 h-7 rounded-full relative cursor-pointer transition-colors ${notifications ? 'bg-[#24A1DE] shadow-[0_0_10px_rgba(36,161,222,0.3)]' : 'bg-white/10'}`}
              >
                <div className={`absolute top-1 w-5 h-5 rounded-full shadow-sm transition-all ${notifications ? 'right-1 bg-white' : 'left-1 bg-white/50'}`} />
              </div>
            </div>
          </div>
        </section>

        {/* --- Раздел: Данные --- */}
        <section>
          <h3 className="text-white/40 text-[13px] font-semibold uppercase tracking-wider ml-4 mb-2">
            Данные и Приватность
          </h3>
          <div className="bg-[#1C1C1D] rounded-3xl border border-white/5 overflow-hidden">
            <button
              onClick={() => setIsClearHistoryModalOpen(true)}
              className="w-full flex items-center justify-between px-5 py-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-4 text-[#FF3B30]">
                <Trash2 size={20} />
                <span className="font-medium text-[15px]">
                  Очистить историю чатов
                </span>
              </div>
            </button>
            <button className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors cursor-pointer text-left">
              <div className="flex items-center gap-4 text-white/90">
                <ShieldCheck size={20} className="text-white/50" />
                <span className="font-medium text-[15px]">
                  Политика конфиденциальности
                </span>
              </div>
            </button>
          </div>
        </section>

        {/* --- Кнопка Выхода --- */}
        <button
          onClick={handleLogout}
          className="w-full py-4 text-[#FF3B30] font-medium bg-[#FF3B30]/10 rounded-3xl border border-[#FF3B30]/20 hover:bg-[#FF3B30]/20 transition-colors cursor-pointer flex items-center justify-center gap-3 mt-4"
        >
          <LogOut size={20} />
          <span className="text-[16px]">Выйти из аккаунта</span>
        </button>
      </div>

      {/* --- МОДАЛКА ОЧИСТКИ ИСТОРИИ --- */}
      {isClearHistoryModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-md">
          <div className="bg-[#1C1C1D] rounded-3xl p-6 w-full max-w-xs border border-white/10 shadow-2xl flex flex-col items-center text-center animate-in fade-in zoom-in duration-200">
            <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
              <Trash2 size={28} className="text-[#FF3B30]" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Очистить историю
            </h2>
            <p className="text-[14px] text-white/60 mb-6 leading-relaxed">
              Вы уверены, что хотите удалить <b>все</b> свои консультации и
              документы? Это действие нельзя будет отменить.
            </p>
            <div className="flex w-full gap-3">
              <button
                onClick={() => setIsClearHistoryModalOpen(false)}
                disabled={isClearing}
                className="flex-1 py-3 rounded-xl font-medium bg-white/5 text-white hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
              >
                Отмена
              </button>
              <button
                onClick={executeClearHistory}
                disabled={isClearing}
                className="flex-1 py-3 rounded-xl font-medium bg-[#FF3B30] text-white hover:bg-red-600 transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isClearing ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  "Удалить"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
