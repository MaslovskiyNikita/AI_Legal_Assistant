// src/features/profile/components/ProfileHeader.tsx
import React, { useState, useRef, useEffect } from "react";
import { Zap, ChevronRight } from "lucide-react";

const TokenCircleMenu = ({ percent }: { percent: number }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Закрытие по клику вне меню
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const radius = 15;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  // Умный цвет кольца в зависимости от остатка
  let strokeColor = "#34C759"; // Зеленый (> 50%)
  if (percent <= 50 && percent > 20) strokeColor = "#FFCC00"; // Желтый (20-50%)
  if (percent <= 20) strokeColor = "#FF3B30"; // Красный (< 20%)

  return (
    <div className="relative z-50" ref={menuRef}>
      {/* Само кольцо */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center justify-center w-10 h-10 bg-white rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.06)] border border-[#F2F2F7] cursor-pointer active:scale-95 transition-all"
      >
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
            stroke={strokeColor}
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
      </div>

      {/* Выпадающее меню (Pop-over) */}
      {isOpen && (
        <div className="absolute top-12 right-0 w-56 bg-white/90 backdrop-blur-xl border border-[#E5E5EA] rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
          <div className="p-4 border-b border-[#E5E5EA]">
            <div className="flex items-center gap-2 mb-1">
              <Zap size={16} className="text-[#FFCC00] fill-current" />
              <span className="text-[14px] font-semibold text-black">
                Баланс токенов
              </span>
            </div>
            <p className="text-[12px] text-[#8E8E93] leading-snug">
              Осталось {percent}% на сегодня. Токены обновятся завтра.
            </p>
          </div>
          <button
            onClick={() => {
              setIsOpen(false);
              alert("Тут будет оплата через Telegram Stars ⭐️");
            }}
            className="w-full flex items-center justify-between p-4 text-[14px] font-medium text-[#3390EC] active:bg-[#F2F2F7] transition-colors"
          >
            Пополнить баланс
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

interface ProfileHeaderProps {
  firstName: string;
  greeting: string;
  onSettingsClick: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  firstName,
  greeting,
  onSettingsClick,
}) => (
  <div className="flex items-center justify-between px-4 pt-4 pb-3 relative z-20">
    <div
      className="flex items-center gap-3 cursor-pointer"
      onClick={onSettingsClick}
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
    {/* Передай сюда реальный процент (например, 15, чтобы увидеть красное кольцо) */}
    <TokenCircleMenu percent={15} />
  </div>
);
