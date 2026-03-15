import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  MessageSquare,
  Scale,
  Briefcase,
  FileSearch,
  CheckCircle2,
  Clock,
  Loader2,
  Plus,
  // Иконки для сводки
  AlertTriangle,
  FileText,
  PenSquare,
} from "lucide-react";

import { apiClient } from "../api/client";

const agents = [
  {
    id: "strict",
    title: "Строгий Юрист",
    description: "Точный анализ по букве закона",
    icon: Scale,
    size: "large",
    prompt: "Действуй как строгий корпоративный юрист. ",
  },
  {
    id: "consultant",
    title: "Консультант",
    description: "Понятно и дружелюбно",
    icon: Briefcase,
    size: "small",
    prompt: "Действуй как дружелюбный и понятный юридический консультант. ",
  },
  {
    id: "analyzer",
    title: "Аналитик",
    description: "Поиск рисков",
    icon: FileSearch,
    size: "small",
    prompt:
      "Твоя задача - проверить документы на ошибки и риски. Будь дотошным. ",
  },
];

const TokenCircleMenu = ({ percent }: { percent: number }) => {
  const radius = 15;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="group relative flex items-center justify-center w-10 h-10 bg-white rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.06)] border border-[#F2F2F7] cursor-pointer active:scale-95 transition-all z-50">
      <svg width="36" height="36" className="transform -rotate-90">
        <circle
          cx="18"
          cy="18"
          r={radius}
          stroke="#F2F2F7"
          strokeWidth="3.5"
          fill="transparent"
        />
        <circle
          cx="18"
          cy="18"
          r={radius}
          stroke="#3390EC"
          strokeWidth="3.5"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <span className="absolute text-[10px] font-bold text-black tracking-tighter">
        {percent}%
      </span>

      {/* Тултип */}
      <div className="absolute top-12 right-0 w-max px-3 py-1.5 bg-[#2C2C2E] text-white text-[11px] font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-center shadow-lg transform origin-top-right">
        Использовано токенов сегодня
      </div>
    </div>
  );
};

export default function Profile() {
  const navigate = useNavigate();
  const [selectedAgent, setSelectedAgent] = useState("strict");
  const [recentChats, setRecentChats] = useState<any[]>([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(true);
  const [greeting, setGreeting] = useState("Доброе утро");

  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const internalUserId = user?.id || null;
  const firstName = user?.first_name || "User";

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreeting("Доброе утро");
    else if (hour >= 12 && hour < 18) setGreeting("Добрый день");
    else if (hour >= 18 && hour < 23) setGreeting("Добрый вечер");
    else setGreeting("Доброй ночи");
  }, []);

  useEffect(() => {
    if (internalUserId) {
      setIsLoadingRecent(true);
      apiClient
        .getChats(internalUserId)
        .then((data) => {
          if (data && data.length > 0) {
            const sorted = data.sort((a: any, b: any) => {
              const dateA = a.created_at || a.createdAt || a.updated_at || null;
              const dateB = b.created_at || b.createdAt || b.updated_at || null;
              if (!dateA) return 1;
              if (!dateB) return -1;
              return new Date(dateB).getTime() - new Date(dateA).getTime();
            });
            setRecentChats(sorted.slice(0, 3));
          }
        })
        .catch((err) => console.error("Ошибка загрузки последних чатов", err))
        .finally(() => setIsLoadingRecent(false));
    } else {
      setIsLoadingRecent(false);
    }
  }, [internalUserId]);

  const startNewChat = () => {
    const agentPrompt =
      agents.find((agent) => agent.id === selectedAgent)?.prompt || "";
    navigate("/chat/new", { state: { initialPrompt: agentPrompt } });
  };

  const formatRecentDateShort = (chat: any) => {
    const dateStr = chat.created_at || chat.createdAt || chat.updated_at;
    if (!dateStr) return "";
    const date = new Date(dateStr);

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

  const weeklyStats = {
    criticalRisks: 7,
    pagesAnalyzed: 128,
    commonEdits: "Сроки, Штрафы",
  };

  return (
    <div className="min-h-screen w-full bg-white text-black relative flex flex-col font-sans overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 relative z-20">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate("/settings")}
        >
          <div className="w-10 h-10 rounded-full bg-[#3390EC] flex items-center justify-center text-white font-medium text-lg shadow-sm">
            {firstName.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="text-[16px] font-semibold leading-tight text-black">
              {firstName}
            </span>
            <span className="text-[13px] text-[#8E8E93]">{greeting}</span>
          </div>
        </div>
        <TokenCircleMenu percent={33} />
      </div>

      <div className="px-4 flex-1 flex flex-col">
        {/* Заголовок */}
        <h1 className="text-3xl font-bold mt-2 mb-4 tracking-tight text-black">
          Выберите стиль
          <br />
          вашего AI-юриста
        </h1>

        {/* Сетка Агентов */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {agents.map((agent) => {
            const isSelected = selectedAgent === agent.id;
            const Icon = agent.icon;

            return (
              <div
                key={agent.id}
                onClick={() => setSelectedAgent(agent.id)}
                className={`
                  rounded-2xl p-4 flex flex-col relative transition-all cursor-pointer border
                  ${agent.size === "large" ? "col-span-1 row-span-2 min-h-[160px]" : "col-span-1"}
                  ${isSelected ? "bg-[#F0F8FF] border-[#3390EC]" : "bg-[#F2F2F7] border-transparent hover:bg-[#E5E5EA]"}
                `}
              >
                {isSelected && (
                  <CheckCircle2
                    size={18}
                    className="absolute top-3 right-3 text-[#3390EC]"
                    fill="white"
                  />
                )}
                <div
                  className={`
                  w-10 h-10 rounded-full mb-auto flex items-center justify-center shrink-0
                  ${isSelected ? "bg-[#3390EC] text-white shadow-sm shadow-blue-500/20" : "bg-white text-[#8E8E93] shadow-sm"}
                `}
                >
                  <Icon size={20} />
                </div>
                <div className="mt-4">
                  <h3 className="text-[14px] font-semibold leading-tight text-black">
                    {agent.title}
                  </h3>
                  {agent.description && (
                    <p
                      className={`text-[12px] mt-1 line-clamp-2 ${isSelected ? "text-[#3390EC]" : "text-[#8E8E93]"}`}
                    >
                      {agent.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Последние чаты */}
        <div className="w-full">
          {isLoadingRecent ? (
            <div className="grid grid-cols-3 gap-2 w-full">
              <div className="h-[96px] bg-[#F2F2F7] rounded-2xl animate-pulse"></div>
              <div className="h-[96px] bg-[#F2F2F7] rounded-2xl animate-pulse"></div>
              <div className="h-[96px] bg-[#F2F2F7] rounded-2xl animate-pulse"></div>
            </div>
          ) : recentChats.length > 0 ? (
            <div>
              <h4 className="text-[13px] font-medium text-[#8E8E93] uppercase tracking-wider mb-2 ml-1">
                Продолжить
              </h4>

              <div className="grid grid-cols-3 gap-2 w-full">
                {recentChats.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => navigate(`/chat/${chat.id}`)}
                    className="min-h-[96px] bg-[#F8F9FA] rounded-2xl p-2.5 border border-[#E5E5EA] flex flex-col justify-between cursor-pointer active:bg-[#E5E5EA] transition-colors overflow-hidden"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Clock size={12} className="text-[#3390EC] shrink-0" />
                      <span className="text-[12px] font-semibold text-[#8E8E93] uppercase tracking-wider truncate">
                        {formatRecentDateShort(chat)}
                      </span>
                    </div>
                    <span className="text-[14px] font-semibold text-black leading-tight line-clamp-2">
                      {chat.title || "Новая консультация"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Этот блок можно будет убрать, когда всегда будут чаты
            <div className="h-[100px]"></div>
          )}
        </div>

        {/* Аналитическая сводка */}
        <div className="mb-4 mt-4">
          <h4 className="text-[13px] font-medium text-[#8E8E93] uppercase tracking-wider mb-2 ml-1">
            Сводка за неделю
          </h4>
          <div className="bg-[#F2F2F7] rounded-2xl overflow-hidden w-full p-2 space-y-2">
            {/* Карточка 1: Риски */}
            <div className="bg-white rounded-xl p-3 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#F0F8FF] flex items-center justify-center shrink-0">
                  <AlertTriangle size={16} className="text-[#3390EC]" />
                </div>
                <span className="font-semibold text-sm text-black">
                  Критических рисков
                </span>
              </div>
              <span className="font-bold text-lg text-[#3390EC]">
                {weeklyStats.criticalRisks}
              </span>
            </div>

            {/* Карточка 2: Страницы */}
            <div className="bg-white rounded-xl p-3 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#F0F8FF] flex items-center justify-center shrink-0">
                  <FileText size={16} className="text-[#3390EC]" />
                </div>
                <span className="font-semibold text-sm text-black">
                  Проанализировано страниц
                </span>
              </div>
              <span className="font-bold text-lg text-[#3390EC]">
                {weeklyStats.pagesAnalyzed}
              </span>
            </div>

            {/* Карточка 3: Частые правки */}
            <div className="bg-white rounded-xl p-3 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#F0F8FF] flex items-center justify-center shrink-0">
                  <PenSquare size={16} className="text-[#3390EC]" />
                </div>
                <span className="font-semibold text-sm text-black">
                  Частые точки правок
                </span>
              </div>
              <span className="font-semibold text-sm text-[#3390EC] truncate">
                {weeklyStats.commonEdits}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Кнопка "Начать чат" */}
      <div className="px-4 pb-6 pt-3 bg-white border-t border-[#F2F2F7]">
        <button
          onClick={startNewChat}
          className="w-full bg-[#3390EC] hover:bg-[#2879c7] text-white font-semibold text-[16px] py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-[0_4px_14px_rgba(51,144,236,0.3)]"
        >
          <Plus size={22} strokeWidth={2.5} />
          Начать новый чат
        </button>
      </div>
    </div>
  );
}
