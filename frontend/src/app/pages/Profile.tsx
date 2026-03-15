// src/app/pages/Profile.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router";
import {
  Menu,
  MessageSquare,
  Scale,
  Briefcase,
  FileSearch,
  Mic,
  ArrowUpRight,
  User,
  Clock,
  Info,
} from "lucide-react";

// --- ДАННЫЕ АГЕНТОВ ---
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
    description: "",
    icon: Briefcase,
    size: "small",
    prompt: "Действуй как дружелюбный и понятный юридический консультант. ",
  },
  {
    id: "analyzer",
    title: "Аналитик",
    description: "",
    icon: FileSearch,
    size: "small",
    prompt:
      "Твоя задача - проверить документы на ошибки и риски. Будь дотошным. ",
  },
];

const TokenUsage = ({ percent }: { percent: number }) => {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className="group relative flex items-center justify-center">
      {/* Круговой индикатор */}
      <svg width="40" height="40" className="transform -rotate-90">
        {/* Фоновый круг (серый) */}
        <circle
          cx="20"
          cy="20"
          r={radius}
          stroke="currentColor"
          strokeWidth="3"
          fill="transparent"
          className="text-white/10"
        />
        {/* Заполняемый круг (пурпурный) */}
        <circle
          cx="20"
          cy="20"
          r={radius}
          stroke="currentColor"
          strokeWidth="3"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="text-[#24A1DE] transition-all duration-1000"
        />
      </svg>
      {/* Текст внутри (опционально) или просто иконка */}
      <div className="absolute flex items-center justify-center">
        <span className="text-[10px] font-bold text-white">{percent}%</span>
      </div>

      {/* Подсказка при наведении (Tooltip) */}
      <div className="absolute top-12 right-0 w-32 p-2 bg-[#1C1C1D] border border-white/10 rounded-lg text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-center shadow-xl">
        Использовано токенов: {percent}%
      </div>
    </div>
  );
};

export default function Profile() {
  const navigate = useNavigate();
  const [inputText, setInputText] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // --- НОВЫЙ СТЕЙТ ДЛЯ ВЫБОРА АГЕНТА ---
  const [selectedAgent, setSelectedAgent] = useState("strict"); // По умолчанию выбран "Строгий юрист"

  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const firstName = user?.first_name || "User";

  // --- ОБНОВЛЕННАЯ ФУНКЦИЯ ---
  // Теперь она будет добавлять системный промпт выбранного агента
  // --- ОБНОВЛЕННАЯ ФУНКЦИЯ ---
  const startNewChat = (promptText?: string | React.MouseEvent) => {
    // Определяем фактический текст юзера: если передали строку (quick prompt), берем ее, иначе текст из инпута
    const actualText = typeof promptText === "string" ? promptText : inputText;

    // Если текста нет, просто открываем пустой чат (чтобы случайно не отправить голый системный промпт)
    if (!actualText.trim()) {
      navigate("/chat/new");
      return;
    }

    // Находим системный промпт выбранного агента
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

  return (
    <div className="min-h-screen w-full bg-black text-white relative flex flex-col overflow-hidden font-sans">
      {/* Фоновое свечение */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-[500px] bg-gradient-to-b from-[#24A1DE]/30 via-[#24A1DE]/10 to-transparent blur-[80px] pointer-events-none z-0"></div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-6 pt-12 pb-4">
        {/* Левая часть: Профиль */}
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate("/settings")}
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#24A1DE] to-[#24A1DE] p-[2px]">
            <div className="w-full h-full bg-[#1C1C1D] rounded-full flex items-center justify-center">
              <User size={20} className="text-[#24A1DE]" />
            </div>
          </div>
          <div>
            <p className="text-[12px] text-white/60 font-medium">Доброе утро</p>
            <p className="text-[16px] font-semibold">{firstName}</p>
          </div>
        </div>

        {/* Правая часть: Токены + Меню */}
        <div className="flex items-center gap-3">
          {/* Индикатор использования токенов */}
          <div className="relative flex items-center justify-center w-10 h-10 group cursor-help">
            <svg width="40" height="40" className="transform -rotate-90">
              <circle
                cx="20"
                cy="20"
                r="16"
                stroke="currentColor"
                strokeWidth="3"
                fill="transparent"
                className="text-white/10"
              />
              <circle
                cx="20"
                cy="20"
                r="16"
                stroke="currentColor"
                strokeWidth="3"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 16}
                strokeDashoffset={
                  2 * Math.PI * 16 - (33 / 100) * (2 * Math.PI * 16)
                } // 33% заполнено
                strokeLinecap="round"
                className="text-[#24A1DE] transition-all duration-1000 ease-out"
              />
            </svg>
            <span className="absolute text-[9px] font-bold text-white">
              33%
            </span>
            {/* Tooltip */}
            <div className="absolute top-12 right-0 w-36 p-3 bg-[#1C1C1D] border border-white/10 rounded-xl text-[11px] text-white/80 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-center shadow-2xl z-50">
              Использовано токенов: 33%
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 px-6 flex-1 flex flex-col">
        {/* Заголовок */}
        <h1 className="text-4xl font-bold mt-6 mb-8 leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
          Выберите стиль
          <br />
          вашего AI-юриста
        </h1>

        {/* Сетка Агентов */}
        <div className="grid grid-cols-2 grid-rows-2 gap-4 mb-8">
          {agents.map((agent) => {
            const isSelected = selectedAgent === agent.id;
            const Icon = agent.icon;
            return (
              <div
                key={agent.id}
                onClick={() => setSelectedAgent(agent.id)}
                className={`
                  col-span-1 rounded-3xl p-4 flex flex-col justify-end relative overflow-hidden group cursor-pointer border-2 transition-all duration-300
                  ${agent.size === "large" ? "row-span-2" : "justify-center"}
                  ${
                    isSelected
                      ? "border-sky-500/80 shadow-lg shadow-sky-900/40"
                      : "border-white/10 bg-[#1C1C1D] hover:bg-[#2C2C2E] hover:border-white/20"
                  }
                `}
                style={
                  isSelected
                    ? {
                        background:
                          "linear-gradient(180deg, rgba(44,44,46,0.5) 0%, rgba(36,161,222,0.2) 100%), #1C1C1D",
                      }
                    : {}
                }
              >
                <div
                  className={`w-8 h-8 rounded-full bg-white/10 flex items-center justify-center ${agent.size === "large" ? "absolute top-4 left-4" : "mb-3"}`}
                >
                  <Icon
                    size={16}
                    className={isSelected ? "text-[#24A1DE]" : "text-white/70"}
                  />
                </div>
                {isSelected && agent.size === "large" && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-[#24A1DE]/30 blur-[40px]"></div>
                )}
                <h3 className="text-[16px] font-semibold relative z-10">
                  {agent.title}
                </h3>
                {agent.size === "large" && (
                  <p className="text-[12px] text-white/60 relative z-10 mt-1">
                    {agent.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Быстрые Промпты */}
        <div className="mt-auto mb-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-[15px] font-medium text-white/80">
              Быстрые запросы
            </h4>
          </div>
          <div className="space-y-3">
            {quickPrompts.map((prompt, idx) => (
              <div
                key={idx}
                onClick={() => startNewChat(prompt)}
                className="flex items-center justify-between p-1 pr-4 bg-[#1C1C1D] rounded-full border border-white/5 cursor-pointer hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3 truncate pr-4">
                  <div className="w-10 h-10 rounded-full bg-[#24A1DE]/20 flex items-center justify-center shrink-0">
                    <MessageSquare size={16} className="text-[#24A1DE]" />
                  </div>
                  <span className="text-[14px] text-white/90 truncate">
                    {prompt}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#2C2C2E] flex items-center justify-center shrink-0">
                  <ArrowUpRight size={16} className="text-white/50" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Поле ввода снизу */}
      <div className="relative z-10 px-6 pb-8 pt-2">
        <div className="flex items-center bg-[#1C1C1D] rounded-full p-2 border border-white/10 focus-within:border-[#24A1DE]/50 transition-colors">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && startNewChat()}
            placeholder="Спроси что угодно..."
            className="flex-1 bg-transparent border-none outline-none text-white px-4 text-[15px] placeholder:text-white/40"
          />
          <button
            onClick={() => startNewChat()}
            className="w-10 h-10 rounded-full bg-[#24A1DE] flex items-center justify-center transition-transform active:scale-95 shadow-lg shadow-sky-500/20"
          >
            <Mic size={18} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
