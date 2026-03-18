// src/features/settings/components/SettingsOptions.tsx
import React from "react";
import {
  Moon,
  Bell,
  ShieldCheck,
  ChevronRight,
  Trash2,
  LogOut,
} from "lucide-react";

interface SettingsOptionsProps {
  theme: string;
  toggleTheme: () => void;
  notifications: boolean;
  toggleNotifications: () => void;
  onOpenPrivacy: () => void;
  onOpenClearHistory: () => void;
  onLogout: () => void;
}

export const SettingsOptions: React.FC<SettingsOptionsProps> = (props) => (
  <>
    <section className="px-4 pt-4 shrink-0">
      <h3 className="text-[var(--tg-theme-hint-color)] text-[13px] font-medium uppercase tracking-wider ml-1 mb-2">
        Основные
      </h3>
      <div className="bg-[var(--tg-theme-bg-color)] rounded-2xl border border-[var(--tg-theme-section-separator-color,rgba(128,128,128,0.2))] overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-[var(--tg-theme-section-separator-color,rgba(128,128,128,0.2))]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#5856D6] flex items-center justify-center">
              <Moon size={16} className="text-white" />
            </div>
            <span className="font-medium text-[16px] text-[var(--tg-theme-text-color)]">
              Темная тема
            </span>
          </div>
          <div
            onClick={props.toggleTheme}
            className={`w-[50px] h-[30px] rounded-full relative cursor-pointer transition-colors duration-300 ${props.theme === "dark" ? "bg-[#34C759]" : "bg-[var(--tg-theme-secondary-bg-color)]"}`}
          >
            <div
              className={`absolute top-[2px] w-[26px] h-[26px] bg-[var(--tg-theme-bg-color)] rounded-full shadow-md transition-all duration-300 ${props.theme === "dark" ? "left-[22px]" : "left-[2px]"}`}
            />
          </div>
        </div>
        <div className="flex items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#FF9500] flex items-center justify-center">
              <Bell size={16} className="text-white" />
            </div>
            <span className="font-medium text-[16px] text-[var(--tg-theme-text-color)]">
              Уведомления
            </span>
          </div>
          <div
            onClick={props.toggleNotifications}
            className={`w-[50px] h-[30px] rounded-full relative cursor-pointer transition-colors duration-300 ${props.notifications ? "bg-[#34C759]" : "bg-[var(--tg-theme-secondary-bg-color)]"}`}
          >
            <div
              className={`absolute top-[2px] w-[26px] h-[26px] bg-[var(--tg-theme-bg-color)] rounded-full shadow-md transition-all duration-300 ${props.notifications ? "left-[22px]" : "left-[2px]"}`}
            />
          </div>
        </div>
      </div>
    </section>

    <section className="px-4 pt-2 shrink-0">
      <h3 className="text-[var(--tg-theme-hint-color)] text-[13px] font-medium uppercase tracking-wider ml-1 mb-2">
        Информация
      </h3>
      <div className="bg-[var(--tg-theme-bg-color)] rounded-2xl border border-[var(--tg-theme-section-separator-color,rgba(128,128,128,0.2))] overflow-hidden shadow-sm">
        <button
          type="button"
          onClick={props.onOpenPrivacy}
          className="w-full flex items-center justify-between px-4 py-3.5 bg-[var(--tg-theme-bg-color)] active:bg-[var(--tg-theme-secondary-bg-color)] transition-colors text-left"
        >
          <div className="flex items-center gap-3 text-[var(--tg-theme-text-color)]">
            <div className="w-8 h-8 rounded-lg bg-[#8E8E93]/10 flex items-center justify-center">
              <ShieldCheck
                size={16}
                className="text-[var(--tg-theme-hint-color)]"
              />
            </div>
            <span className="font-medium text-[16px]">
              Политика конфиденциальности
            </span>
          </div>
          <ChevronRight size={18} className="text-[#C7C7CC]" />
        </button>
      </div>
    </section>

    <section className="px-4 pt-8 mt-auto shrink-0">
      <div className="bg-[var(--tg-theme-bg-color)] rounded-2xl border border-[var(--tg-theme-section-separator-color,rgba(128,128,128,0.2))] overflow-hidden shadow-sm flex flex-col">
        <button
          type="button"
          onClick={props.onOpenClearHistory}
          className="w-full flex items-center justify-between px-4 py-3.5 border-b border-[var(--tg-theme-section-separator-color,rgba(128,128,128,0.2))] bg-[var(--tg-theme-bg-color)] active:bg-[var(--tg-theme-secondary-bg-color)] transition-colors text-left"
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
          type="button"
          onClick={props.onLogout}
          className="w-full flex items-center justify-between px-4 py-3.5 bg-[var(--tg-theme-bg-color)] active:bg-[var(--tg-theme-secondary-bg-color)] transition-colors text-left"
        >
          <div className="flex items-center gap-3 text-[#FF3B30]">
            <div className="w-8 h-8 rounded-lg bg-[#FF3B30]/10 flex items-center justify-center">
              <LogOut size={16} />
            </div>
            <span className="font-medium text-[16px]">Выйти из аккаунта</span>
          </div>
        </button>
      </div>
    </section>
  </>
);
