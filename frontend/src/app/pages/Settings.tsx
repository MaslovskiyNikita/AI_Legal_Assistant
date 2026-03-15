// src/app/pages/Settings.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  ChevronLeft,
  Trash2,
  Bell,
  Moon,
  ShieldCheck,
  Loader2,
  MessageSquare,
  CalendarDays,
  CalendarRange,
  ChevronRight,
  Clock,
  Layers,
  FileText,
  CheckCircle2,
  Download,
  X,
  LogOut,
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

  // Стейты модалок
  const [isClearHistoryModalOpen, setIsClearHistoryModalOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

  // Основные стейты
  const [activeTab, setActiveTab] = useState<"chats" | "documents">("chats");
  const [chats, setChats] = useState<any[]>([]);
  const [allDocuments, setAllDocuments] = useState<any[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [downloadingDocId, setDownloadingDocId] = useState<number | null>(null);

  const [theme, setTheme] = useState(user?.theme || "dark");
  const [notifications, setNotifications] = useState(
    user?.notifications_enabled ?? true,
  );

  // --- СТЕЙТЫ ДЛЯ ФИЛЬТРОВ ---
  const [filterPeriod, setFilterPeriod] = useState<
    "all" | "today" | "week" | "custom"
  >("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [showAllChats, setShowAllChats] = useState(false);
  const [showAllDocuments, setShowAllDocuments] = useState(false);
  const getChatDateStr = (chat: any) =>
    chat.created_at || chat.createdAt || chat.updated_at || null;

  useEffect(() => {
    if (internalUserId) {
      apiClient
        .getChats(internalUserId)
        .then(async (data) => {
          const sorted = (data || []).sort((a: any, b: any) => {
            const dateA = getChatDateStr(a);
            const dateB = getChatDateStr(b);
            if (!dateA) return 1;
            if (!dateB) return -1;
            return new Date(dateB).getTime() - new Date(dateA).getTime();
          });
          setChats(sorted);

          let docsArray: any[] = [];
          try {
            const docsPromises = sorted.map((chat: any) =>
              apiClient.getChatDocuments(chat.id).then((docs) =>
                docs.map((d: any) => ({
                  ...d,
                  chatTitle: chat.title,
                  chatId: chat.id,
                  chatDate: getChatDateStr(chat), // Добавляем дату чата как фоллбэк
                })),
              ),
            );
            const docsResults = await Promise.allSettled(docsPromises);

            docsResults.forEach((result) => {
              if (result.status === "fulfilled" && result.value) {
                docsArray = [...docsArray, ...result.value];
              }
            });

            docsArray.sort((a, b) => {
              const dateA = new Date(
                a.created_at || a.createdAt || a.updated_at || a.chatDate || 0,
              ).getTime();
              const dateB = new Date(
                b.created_at || b.createdAt || b.updated_at || b.chatDate || 0,
              ).getTime();
              return dateB - dateA;
            });
          } catch (err) {
            console.error("Ошибка при получении документов", err);
          }
          setAllDocuments(docsArray);
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
        setAllDocuments([]);
      }
      setIsClearHistoryModalOpen(false);
    } catch (error) {
      console.error("Failed to clear history", error);
      alert("Не удалось очистить историю. Пожалуйста, попробуйте еще раз.");
    } finally {
      setIsClearing(false);
    }
  };

  const handleDownload = async (
    e: React.MouseEvent,
    docId: number,
    filename: string,
  ) => {
    e.stopPropagation();
    setDownloadingDocId(docId);
    try {
      await apiClient.downloadDocument(docId, filename);
    } catch (err) {
      console.error("Ошибка скачивания", err);
      alert("Не удалось скачать файл");
    } finally {
      setDownloadingDocId(null);
    }
  };

  const toggleTheme = async () => {
    if (!internalUserId) return;
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    try {
      await apiClient.updateSettings(internalUserId, { theme: newTheme });
      localStorage.setItem(
        "user",
        JSON.stringify({ ...user, theme: newTheme }),
      );
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
      await apiClient.updateSettings(internalUserId, {
        notifications_enabled: newNotifications,
      });
      localStorage.setItem(
        "user",
        JSON.stringify({ ...user, notifications_enabled: newNotifications }),
      );
    } catch (error) {
      console.error("Failed to update notifications", error);
      setNotifications(notifications);
    }
  };

  // --- ЛОГИКА ФИЛЬТРАЦИИ ---
  const isDateInFilter = (dateStr: string | null) => {
    if (filterPeriod === "all") return true;
    if (!dateStr) return false;

    const date = new Date(dateStr);
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    if (filterPeriod === "today") {
      return date >= startOfToday;
    }

    if (filterPeriod === "week") {
      const aWeekAgo = new Date(startOfToday);
      aWeekAgo.setDate(aWeekAgo.getDate() - 7);
      return date >= aWeekAgo;
    }

    if (filterPeriod === "custom") {
      if (!customStartDate && !customEndDate) return true;
      let isValid = true;
      if (customStartDate) {
        const start = new Date(customStartDate);
        start.setHours(0, 0, 0, 0);
        isValid = isValid && date >= start;
      }
      if (customEndDate) {
        const end = new Date(customEndDate);
        end.setHours(23, 59, 59, 999);
        isValid = isValid && date <= end;
      }
      return isValid;
    }
    return true;
  };

  // Применяем фильтр к чатам
  const filteredChats = chats.filter((chat) =>
    isDateInFilter(getChatDateStr(chat)),
  );
  const displayedChats = showAllChats
    ? filteredChats
    : filteredChats.slice(0, 5);

  // Применяем фильтр к документам
  const filteredDocuments = allDocuments.filter((doc) =>
    isDateInFilter(
      doc.created_at || doc.createdAt || doc.updated_at || doc.chatDate || null,
    ),
  );

  // Добавляем обрезку списка до 5 штук
  const displayedDocuments = showAllDocuments
    ? filteredDocuments
    : filteredDocuments.slice(0, 5);

  // Массив конфигурации фильтров для рендера
  const filters = [
    { id: "all", label: "Все", icon: Layers },
    { id: "today", label: "Сегодня", icon: Clock },
    { id: "week", label: "Неделя", icon: CalendarDays },
    { id: "custom", label: "Период", icon: CalendarRange },
  ];

  return (
    <div className="min-h-screen w-full bg-[#F2F2F7] text-black flex flex-col pb-10 relative font-sans overflow-x-hidden">
      {/* Header */}
      <div className="h-14 px-4 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-xl z-20 border-b border-[#E5E5EA]">
        <button
          onClick={() => navigate("/profile")}
          className="flex items-center text-[#3390EC] active:opacity-70 transition-opacity"
        >
          <ChevronLeft size={24} className="-ml-1" />
          <span className="text-[17px]">Назад</span>
        </button>
        <h2 className="absolute left-1/2 -translate-x-1/2 text-[17px] font-semibold text-black">
          Настройки
        </h2>
      </div>

      <div className="flex-1 z-10 relative space-y-6 pt-6 pb-8 flex flex-col">
        {/* Карточка профиля */}
        <div className="flex flex-col items-center justify-center px-4 shrink-0">
          <div className="w-20 h-20 rounded-full bg-[#3390EC] flex items-center justify-center text-white text-3xl font-medium mb-3 shadow-sm">
            {firstName.charAt(0).toUpperCase()}
          </div>
          <h1 className="text-2xl font-bold text-black mb-0.5">{firstName}</h1>
          <p className="text-[15px] text-[#8E8E93] mb-6">{username}</p>

          {/* ВКЛАДКИ (ТАБЫ) СО СТАТИСТИКОЙ */}
          <div className="w-full flex gap-3">
            <div
              onClick={() => setActiveTab("chats")}
              className={`flex-1 border rounded-2xl p-4 flex flex-col items-center justify-center shadow-sm relative transition-all cursor-pointer ${activeTab === "chats" ? "bg-[#F0F8FF] border-[#3390EC]" : "bg-white border-[#E5E5EA] active:bg-[#F2F2F7]"}`}
            >
              {activeTab === "chats" && (
                <CheckCircle2
                  size={18}
                  className="absolute top-3 right-3 text-[#3390EC]"
                  fill="white"
                />
              )}
              <div
                className={`w-10 h-10 rounded-full mb-1.5 flex items-center justify-center ${activeTab === "chats" ? "bg-[#3390EC] text-white shadow-sm shadow-blue-500/20" : "bg-[#F2F2F7] text-[#8E8E93]"}`}
              >
                <MessageSquare size={20} />
              </div>
              <span className="text-2xl font-bold text-black mb-0.5">
                {isLoadingStats ? (
                  <Loader2 size={24} className="animate-spin text-[#8E8E93]" />
                ) : (
                  chats.length
                )}
              </span>
              <span
                className={`text-[11px] font-semibold uppercase tracking-wide ${activeTab === "chats" ? "text-[#3390EC]" : "text-[#8E8E93]"}`}
              >
                Консультаций
              </span>
            </div>

            <div
              onClick={() => setActiveTab("documents")}
              className={`flex-1 border rounded-2xl p-4 flex flex-col items-center justify-center shadow-sm relative transition-all cursor-pointer ${activeTab === "documents" ? "bg-[#F0F8FF] border-[#3390EC]" : "bg-white border-[#E5E5EA] active:bg-[#F2F2F7]"}`}
            >
              {activeTab === "documents" && (
                <CheckCircle2
                  size={18}
                  className="absolute top-3 right-3 text-[#3390EC]"
                  fill="white"
                />
              )}
              <div
                className={`w-10 h-10 rounded-full mb-1.5 flex items-center justify-center ${activeTab === "documents" ? "bg-[#3390EC] text-white shadow-sm shadow-blue-500/20" : "bg-[#F2F2F7] text-[#8E8E93]"}`}
              >
                <FileText size={20} />
              </div>
              <span className="text-2xl font-bold text-black mb-0.5">
                {isLoadingStats ? (
                  <Loader2 size={24} className="animate-spin text-[#8E8E93]" />
                ) : (
                  allDocuments.length
                )}
              </span>
              <span
                className={`text-[11px] font-semibold uppercase tracking-wide ${activeTab === "documents" ? "text-[#3390EC]" : "text-[#8E8E93]"}`}
              >
                Документов
              </span>
            </div>
          </div>
        </div>

        {/* --- ОБЪЕДИНЕННАЯ СЕКЦИЯ КОНТЕНТА (ФИЛЬТРЫ + СПИСКИ) --- */}
        <section className="pt-2 animate-in fade-in duration-300 shrink-0">
          <div className="flex items-center justify-between mb-3 px-4">
            <h3 className="text-[13px] font-medium text-[#8E8E93] uppercase tracking-wider ml-1">
              {activeTab === "chats" ? "История запросов" : "Сохраненные файлы"}
            </h3>
          </div>

          {/* КВАДРАТНЫЕ ФИЛЬТРЫ (РАСТЯНУТЫ НА ВСЮ ШИРИНУ) */}
          <div className="grid grid-cols-4 gap-2 px-4 mb-4">
            {filters.map((filter) => {
              const isSelected = filterPeriod === filter.id;
              const Icon = filter.icon;

              return (
                <button
                  key={filter.id}
                  onClick={() => {
                    setFilterPeriod(filter.id as any);
                    setShowAllChats(false);
                    setShowAllDocuments(false);
                  }}
                  className={`flex flex-col items-center justify-center h-[70px] rounded-2xl border transition-all cursor-pointer
                    ${isSelected ? "bg-[#3390EC] border-[#3390EC] text-white shadow-sm shadow-blue-500/20" : "bg-white border-[#E5E5EA] text-[#8E8E93] active:bg-[#F2F2F7]"}`}
                >
                  <Icon
                    size={20}
                    className={`mb-1.5 ${isSelected ? "text-white" : "text-black"}`}
                  />
                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider ${isSelected ? "text-white/90" : "text-[#8E8E93]"}`}
                  >
                    {filter.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ИНПУТЫ ДЛЯ КАСТОМНОГО ПЕРИОДА */}
          {filterPeriod === "custom" && (
            <div className="mx-4 mb-4 flex items-center gap-2 animate-in slide-in-from-top-2 fade-in duration-200">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="flex-1 h-10 bg-white border border-[#E5E5EA] rounded-xl px-3 text-[14px] text-black outline-none focus:border-[#3390EC] transition-colors appearance-none"
              />
              <span className="text-[#8E8E93] font-medium">—</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="flex-1 h-10 bg-white border border-[#E5E5EA] rounded-xl px-3 text-[14px] text-black outline-none focus:border-[#3390EC] transition-colors appearance-none"
              />
            </div>
          )}

          {/* КОНТЕЙНЕР СО СПИСКОМ (ОБЩИЙ) */}
          <div className="mx-4 bg-white rounded-2xl border border-[#E5E5EA] overflow-hidden flex flex-col min-h-[120px] shadow-sm">
            {activeTab === "chats" ? (
              // --- РЕНДЕР ЧАТОВ ---
              isLoadingStats ? (
                <div className="flex-1 flex items-center justify-center py-8">
                  <Loader2 size={24} className="animate-spin text-[#8E8E93]" />
                </div>
              ) : chats.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-8 text-center px-4">
                  <Clock size={32} className="text-[#C7C7CC] mb-3" />
                  <p className="text-[#8E8E93] text-[15px]">
                    У вас пока нет консультаций
                  </p>
                </div>
              ) : filteredChats.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-8 text-center px-4">
                  <CalendarDays size={32} className="text-[#C7C7CC] mb-3" />
                  <p className="text-[#8E8E93] text-[15px]">
                    Нет консультаций за выбранный период
                  </p>
                </div>
              ) : (
                <>
                  {displayedChats.map((chat: any, idx) => {
                    const displayDate = chat.created_at
                      ? new Date(chat.created_at).toLocaleDateString("ru-RU", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "";
                    return (
                      <button
                        key={chat.id}
                        onClick={() => navigate(`/chat/${chat.id}`)}
                        className={`w-full flex items-center justify-between px-4 py-3.5 bg-white active:bg-[#F2F2F7] transition-colors cursor-pointer text-left ${idx !== displayedChats.length - 1 ? "border-b border-[#E5E5EA]" : ""}`}
                      >
                        <div className="flex items-center gap-3 overflow-hidden pr-4">
                          <div className="w-9 h-9 rounded-full bg-[#F0F8FF] flex items-center justify-center shrink-0">
                            <MessageSquare
                              size={16}
                              className="text-[#3390EC]"
                            />
                          </div>
                          <div className="flex flex-col overflow-hidden">
                            <span className="font-semibold text-[15px] text-black truncate">
                              {chat.title || "Новая консультация"}
                            </span>
                            <span className="text-[13px] text-[#8E8E93] mt-0.5">
                              {displayDate}
                            </span>
                          </div>
                        </div>
                        <ChevronRight
                          size={18}
                          className="text-[#C7C7CC] shrink-0"
                        />
                      </button>
                    );
                  })}
                  {filteredChats.length > 5 && (
                    <button
                      onClick={() => setShowAllChats(!showAllChats)}
                      className="w-full py-3.5 text-[15px] font-medium text-[#3390EC] bg-white active:bg-[#F2F2F7] transition-colors cursor-pointer border-t border-[#E5E5EA]"
                    >
                      {showAllChats
                        ? "Скрыть"
                        : `Показать все (${filteredChats.length})`}
                    </button>
                  )}
                </>
              )
            ) : // --- РЕНДЕР ДОКУМЕНТОВ ---
            isLoadingStats ? (
              <div className="flex-1 flex items-center justify-center py-8">
                <Loader2 size={24} className="animate-spin text-[#8E8E93]" />
              </div>
            ) : allDocuments.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-8 text-center px-4">
                <FileText size={32} className="text-[#C7C7CC] mb-3" />
                <p className="text-[#8E8E93] text-[15px]">
                  У вас пока нет загруженных документов
                </p>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-8 text-center px-4">
                <CalendarDays size={32} className="text-[#C7C7CC] mb-3" />
                <p className="text-[#8E8E93] text-[15px]">
                  Нет документов за выбранный период
                </p>
              </div>
            ) : (
              <>
                {displayedDocuments.map((doc: any, idx) => {
                  const isDownloading = downloadingDocId === doc.id;
                  const docDateStr =
                    doc.created_at ||
                    doc.createdAt ||
                    doc.updated_at ||
                    doc.chatDate;
                  const displayDate = docDateStr
                    ? new Date(docDateStr).toLocaleDateString("ru-RU", {
                        day: "numeric",
                        month: "short",
                      })
                    : "Документ из чата";
                  return (
                    <div
                      key={doc.id}
                      onClick={() => navigate(`/chat/${doc.chatId}`)}
                      className={`w-full flex items-center justify-between px-4 py-3.5 bg-white hover:bg-[#F9FAFB] active:bg-[#F2F2F7] transition-colors cursor-pointer text-left ${idx !== displayedDocuments.length - 1 ? "border-b border-[#E5E5EA]" : ""}`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden pr-2">
                        <div className="w-10 h-10 rounded-lg bg-[#F0F8FF] border border-[#E5E5EA] flex items-center justify-center shrink-0">
                          <FileText size={18} className="text-[#3390EC]" />
                        </div>
                        <div className="flex flex-col overflow-hidden">
                          <span className="font-semibold text-[15px] text-black truncate">
                            {doc.filename || `Документ #${doc.id}`}
                          </span>
                          <span className="text-[12px] text-[#8E8E93] mt-0.5 truncate">
                            {displayDate} • {doc.chatTitle || "Консультация"}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) =>
                          handleDownload(
                            e,
                            doc.id,
                            doc.filename || "document.pdf",
                          )
                        }
                        disabled={isDownloading}
                        className="w-9 h-9 shrink-0 rounded-full bg-[#F2F2F7] flex items-center justify-center text-[#3390EC] hover:bg-[#E5E5EA] active:scale-95 transition-all"
                      >
                        {isDownloading ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Download size={16} />
                        )}
                      </button>
                    </div>
                  );
                })}
                {/* Кнопка Показать все для документов */}
                {filteredDocuments.length > 5 && (
                  <button
                    onClick={() => setShowAllDocuments(!showAllDocuments)}
                    className="w-full py-3.5 text-[15px] font-medium text-[#3390EC] bg-white active:bg-[#F2F2F7] transition-colors cursor-pointer border-t border-[#E5E5EA]"
                  >
                    {showAllDocuments
                      ? "Скрыть"
                      : `Показать все (${filteredDocuments.length})`}
                  </button>
                )}
              </>
            )}
          </div>
        </section>
        {/* --- Раздел: Основные --- */}
        <section className="px-4 pt-4 shrink-0">
          <h3 className="text-[#8E8E93] text-[13px] font-medium uppercase tracking-wider ml-1 mb-2">
            Основные
          </h3>
          <div className="bg-white rounded-2xl border border-[#E5E5EA] overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#E5E5EA]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#5856D6] flex items-center justify-center">
                  <Moon size={16} className="text-white" />
                </div>
                <span className="font-medium text-[16px] text-black">
                  Темная тема
                </span>
              </div>
              <div
                onClick={toggleTheme}
                className={`w-[50px] h-[30px] rounded-full relative cursor-pointer transition-colors duration-300 ${theme === "dark" ? "bg-[#34C759]" : "bg-[#E5E5EA]"}`}
              >
                <div
                  className={`absolute top-[2px] w-[26px] h-[26px] bg-white rounded-full shadow-md transition-all duration-300 ${theme === "dark" ? "left-[22px]" : "left-[2px]"}`}
                />
              </div>
            </div>
            <div className="flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#FF9500] flex items-center justify-center">
                  <Bell size={16} className="text-white" />
                </div>
                <span className="font-medium text-[16px] text-black">
                  Уведомления
                </span>
              </div>
              <div
                onClick={toggleNotifications}
                className={`w-[50px] h-[30px] rounded-full relative cursor-pointer transition-colors duration-300 ${notifications ? "bg-[#34C759]" : "bg-[#E5E5EA]"}`}
              >
                <div
                  className={`absolute top-[2px] w-[26px] h-[26px] bg-white rounded-full shadow-md transition-all duration-300 ${notifications ? "left-[22px]" : "left-[2px]"}`}
                />
              </div>
            </div>
          </div>
        </section>

        {/* --- Раздел: Информация --- */}
        <section className="px-4 pt-2 shrink-0">
          <h3 className="text-[#8E8E93] text-[13px] font-medium uppercase tracking-wider ml-1 mb-2">
            Информация
          </h3>
          <div className="bg-white rounded-2xl border border-[#E5E5EA] overflow-hidden shadow-sm">
            <button
              onClick={() => setIsPrivacyModalOpen(true)}
              className="w-full flex items-center justify-between px-4 py-3.5 bg-white active:bg-[#F2F2F7] transition-colors text-left"
            >
              <div className="flex items-center gap-3 text-black">
                <div className="w-8 h-8 rounded-lg bg-[#8E8E93]/10 flex items-center justify-center">
                  <ShieldCheck size={16} className="text-[#8E8E93]" />
                </div>
                <span className="font-medium text-[16px]">
                  Политика конфиденциальности
                </span>
              </div>
              <ChevronRight size={18} className="text-[#C7C7CC]" />
            </button>
          </div>
        </section>

        {/* --- Опасная зона (Удаление и Выход) - Прижата к низу --- */}
        <section className="px-4 pt-8 mt-auto shrink-0">
          <div className="bg-white rounded-2xl border border-[#E5E5EA] overflow-hidden shadow-sm flex flex-col">
            <button
              onClick={() => setIsClearHistoryModalOpen(true)}
              className="w-full flex items-center justify-between px-4 py-3.5 border-b border-[#E5E5EA] bg-white active:bg-[#F2F2F7] transition-colors text-left"
            >
              <div className="flex items-center gap-3 text-[#FF3B30]">
                <div className="w-8 h-8 rounded-lg bg-[#FF3B30]/10 flex items-center justify-center">
                  <Trash2 size={16} />
                </div>
                <span className="font-medium text-[16px]">
                  Очистить историю запросов
                </span>
              </div>
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-between px-4 py-3.5 bg-white active:bg-[#F2F2F7] transition-colors text-left"
            >
              <div className="flex items-center gap-3 text-[#FF3B30]">
                <div className="w-8 h-8 rounded-lg bg-[#FF3B30]/10 flex items-center justify-center">
                  <LogOut size={16} />
                </div>
                <span className="font-medium text-[16px]">
                  Выйти из аккаунта
                </span>
              </div>
            </button>
          </div>
        </section>
      </div>

      {/* --- МОДАЛКА ОЧИСТКИ ИСТОРИИ --- */}
      {isClearHistoryModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-[300px] flex flex-col items-center text-center overflow-hidden animate-in zoom-in-95 duration-200 shadow-2xl">
            <div className="p-6 pb-5">
              <h2 className="text-[17px] font-semibold text-black mb-1.5">
                Очистить историю?
              </h2>
              <p className="text-[13px] text-[#8E8E93] leading-snug">
                Вы уверены, что хотите удалить все консультации? Это действие
                нельзя отменить.
              </p>
            </div>
            <div className="flex flex-col w-full border-t border-[#E5E5EA]">
              <button
                onClick={executeClearHistory}
                disabled={isClearing}
                className="w-full py-3.5 text-[17px] font-normal text-[#FF3B30] border-b border-[#E5E5EA] active:bg-[#F2F2F7] transition-colors flex items-center justify-center gap-2"
              >
                {isClearing ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  "Удалить все"
                )}
              </button>
              <button
                onClick={() => setIsClearHistoryModalOpen(false)}
                disabled={isClearing}
                className="w-full py-3.5 text-[17px] font-semibold text-[#3390EC] active:bg-[#F2F2F7] transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- МОДАЛКА ПОЛИТИКИ КОНФИДЕНЦИАЛЬНОСТИ --- */}
      {isPrivacyModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-[500px] max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-300 shadow-2xl pb-safe">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#E5E5EA] shrink-0">
              <h2 className="text-[17px] font-semibold text-black">
                Политика конфиденциальности
              </h2>
              <button
                onClick={() => setIsPrivacyModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-[#F2F2F7] text-[#8E8E93] active:bg-[#E5E5EA] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto text-[15px] leading-relaxed text-[#3A3A3C] space-y-4">
              <p className="text-[13px] text-[#8E8E93] font-medium">
                Последнее обновление: {new Date().toLocaleDateString("ru-RU")}
              </p>
              <p>
                Это демонстрационная заглушка для политики конфиденциальности. В
                реальном приложении здесь будет размещен юридически значимый
                текст, описывающий сбор, хранение и обработку персональных
                данных пользователей сервиса.
              </p>

              <h3 className="font-semibold text-black text-[16px] mt-4">
                1. Сбор информации
              </h3>
              <p>
                Мы собираем информацию, когда вы регистрируетесь в
                Telegram-боте, заходите в свой аккаунт, загружаете документы и
                общаетесь с ИИ. Информация включает ваш Telegram ID, имя, а
                также историю текстовых запросов.
              </p>

              <h3 className="font-semibold text-black text-[16px] mt-4">
                2. Использование данных ИИ
              </h3>
              <p>
                Загруженные вами документы и отправленные сообщения используются
                исключительно для генерации ответов нейросетью. Мы не используем
                ваши личные договоры и персональные данные для дообучения
                глобальных моделей.
              </p>

              <h3 className="font-semibold text-black text-[16px] mt-4">
                3. Защита информации
              </h3>
              <p>
                Мы используем современные методы шифрования для защиты вашей
                конфиденциальной информации. Доступ к вашим чатам и файлам есть
                только у вас. Серверы, на которых хранятся данные, находятся в
                защищенном окружении.
              </p>

              <h3 className="font-semibold text-black text-[16px] mt-4">
                4. Удаление данных
              </h3>
              <p>
                Вы имеете полное право в любой момент запросить удаление всей
                своей истории, нажав на кнопку «Очистить историю запросов» в
                настройках. После этого данные безвозвратно удаляются с наших
                серверов.
              </p>
            </div>

            <div className="p-4 border-t border-[#E5E5EA] bg-white shrink-0">
              <button
                onClick={() => setIsPrivacyModalOpen(false)}
                className="w-full py-3.5 bg-[#3390EC] text-white font-semibold rounded-xl active:bg-blue-600 transition-colors shadow-sm"
              >
                Понятно
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
