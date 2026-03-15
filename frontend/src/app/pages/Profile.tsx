// src/app/pages/Profile.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  MessageSquare,
  Scale,
  Briefcase,
  FileSearch,
  ChevronRight,
  CheckCircle2,
  ArrowUp,
  Clock,
  Loader2,
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
  const [inputText, setInputText] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("strict");
  const [recentChats, setRecentChats] = useState<any[]>([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(true);

  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const internalUserId = user?.id || null;
  const firstName = user?.first_name || "User";

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

  const startNewChat = (promptText?: string | React.MouseEvent) => {
    const actualText = typeof promptText === "string" ? promptText : inputText;
    if (!actualText.trim()) {
      navigate("/chat/new");
      return;
    }
    const agentPrompt =
      agents.find((agent) => agent.id === selectedAgent)?.prompt || "";
    const textToSend = agentPrompt + actualText;
    navigate("/chat/new", { state: { initialPrompt: textToSend } });
  };

  const quickPrompts = [
    "Проверь договор аренды на риски",
    "Объясни штрафы по ГК РФ простым языком",
    "Составь NDA для разработчика",
  ];

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

  return (
    <div className="min-h-screen w-full bg-white text-black relative flex flex-col font-sans overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-6 pb-4 relative z-20">
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
            <span className="text-[13px] text-[#8E8E93]">Доброе утро</span>
          </div>
        </div>
        <TokenCircleMenu percent={33} />
      </div>

      <div className="px-4 flex-1 flex flex-col">
        <h1 className="text-3xl font-bold mt-2 mb-6 tracking-tight text-black">
          Выберите стиль
          <br />
          вашего AI-юриста
        </h1>

        {/* Сетка Агентов */}
        <div className="grid grid-cols-2 gap-3 mb-6">
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
                  w-10 h-10 rounded-full mb-auto flex items-center justify-center
                  ${isSelected ? "bg-[#3390EC] text-white shadow-sm shadow-blue-500/20" : "bg-white text-[#8E8E93] shadow-sm"}
                `}
                >
                  <Icon size={20} />
                </div>
                <div className="mt-4">
                  <h3 className="text-[16px] font-semibold leading-tight text-black">
                    {agent.title}
                  </h3>
                  {agent.description && (
                    <p
                      className={`text-[13px] mt-1 line-clamp-2 ${isSelected ? "text-[#3390EC]" : "text-[#8E8E93]"}`}
                    >
                      {agent.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Последние чаты ИЛИ Пустое состояние */}
        <div className="mb-auto w-full">
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

              {/* ОБНОВЛЕННАЯ СЕТКА: 3 карточки в ряд, ширина совпадает с быстрыми запросами */}
              <div className="grid grid-cols-3 gap-2 w-full">
                {recentChats.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => navigate(`/chat/${chat.id}`)}
                    className="h-[96px] bg-[#F8F9FA] rounded-2xl p-2.5 border border-[#E5E5EA] flex flex-col justify-between cursor-pointer active:bg-[#E5E5EA] transition-colors overflow-hidden"
                  >
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} className="text-[#3390EC] shrink-0" />
                      <span className="text-[10px] font-semibold text-[#8E8E93] uppercase tracking-wider truncate">
                        {formatRecentDateShort(chat)}
                      </span>
                    </div>
                    <span className="text-[12px] font-semibold text-black leading-tight line-clamp-2">
                      {chat.title || "Новая консультация"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-7 px-4 bg-[#F8F9FA] rounded-2xl border border-[#E5E5EA] border-dashed text-center">
              <div className="w-12 h-12 rounded-full bg-[#E5E5EA] flex items-center justify-center mb-3">
                <MessageSquare size={24} className="text-[#8E8E93]" />
              </div>
              <span className="text-[15px] font-semibold text-black mb-1">
                Здесь пока пусто
              </span>
              <span className="text-[13px] text-[#8E8E93] leading-snug max-w-[240px]">
                Здесь будут отображаться ваши последние консультации с AI.
              </span>
            </div>
          )}
        </div>

        {/* Быстрые Промпты */}
        <div className="mb-4 mt-6">
          <h4 className="text-[13px] font-medium text-[#8E8E93] uppercase tracking-wider mb-2 ml-1">
            Быстрые запросы
          </h4>
          <div className="bg-[#F2F2F7] rounded-2xl overflow-hidden w-full">
            {quickPrompts.map((prompt, idx) => (
              <div
                key={idx}
                onClick={() => startNewChat(prompt)}
                className={`
                  flex items-center justify-between p-4 cursor-pointer active:bg-[#E5E5EA] transition-colors
                  ${idx !== quickPrompts.length - 1 ? "border-b border-[#E5E5EA]" : ""}
                `}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
                    <MessageSquare size={16} className="text-[#3390EC]" />
                  </div>
                  <span className="text-[15px] font-medium text-black truncate pr-2">
                    {prompt}
                  </span>
                </div>
                <ChevronRight size={20} className="text-[#C7C7CC] shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Поле ввода снизу */}
      <div className="px-4 pb-6 pt-2 bg-white border-t border-[#F2F2F7]">
        <div className="flex items-end gap-2 w-full">
          <div className="flex-1 bg-[#F2F2F7] border border-[#E5E5EA] rounded-3xl min-h-[44px] flex items-center px-4 py-1 focus-within:border-[#3390EC] transition-colors">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && startNewChat()}
              placeholder="Спроси что угодно..."
              className="flex-1 bg-transparent border-none outline-none text-black text-[16px] placeholder:text-[#8E8E93]"
            />
          </div>
          <button
            onClick={() => startNewChat()}
            disabled={!inputText.trim()}
            className={`
              w-[44px] h-[44px] shrink-0 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-sm
              ${
                inputText.trim()
                  ? "bg-[#3390EC] text-white shadow-blue-500/30"
                  : "bg-[#E5E5EA] text-[#8E8E93] cursor-not-allowed"
              }
            `}
          >
            <ArrowUp size={20} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
