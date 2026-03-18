import React, { useState } from "react";
import { useNavigate } from "react-router";
import {
  ChevronLeft,
  MoreVertical,
  Download,
  Share2,
  Trash2,
} from "lucide-react";
import { isTelegramWebApp } from "../../../utils/telegram";

interface ChatHeaderProps {
  chatId?: string;
  onOpenDownload: () => void;
  onOpenExport: () => void;
  onOpenDelete: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  chatId,
  onOpenDownload,
  onOpenExport,
  onOpenDelete,
}) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isWeb = !isTelegramWebApp();

  return (
    <div className="h-14 px-4 flex items-center justify-between sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-[#E5E5EA]">
      {/* ЛЕВАЯ ЧАСТЬ: Кнопка назад (только для Web). 
          Оставляем ширину w-8, чтобы заголовок оставался ровно по центру */}
      <div className="flex items-center z-10 w-8">
        {isWeb && (
          <button
            type="button"
            onClick={() => navigate("/profile")}
            className="w-8 h-8 -ml-2 flex items-center justify-center text-[var(--tg-theme-button-color)] active:opacity-70 transition-opacity cursor-pointer"
          >
            <ChevronLeft size={28} />
          </button>
        )}
      </div>

      {/* ЦЕНТР: Заголовок */}
      <span className="absolute left-1/2 -translate-x-1/2 text-[17px] font-semibold text-black">
        Legal Expert
      </span>

      {/* ПРАВАЯ ЧАСТЬ: Троеточие и выпадающее меню */}
      <div className="relative flex items-center justify-end z-10 w-8">
        <button
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="w-8 h-8 flex items-center justify-center text-[var(--tg-theme-button-color)] active:opacity-70 transition-opacity cursor-pointer"
        >
          <MoreVertical size={24} />
        </button>

        {isMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsMenuOpen(false)}
            />
            {/* ИЗМЕНЕНО: Поменяли left-0 на right-0, чтобы меню открывалось внутрь экрана, а не за его пределы */}
            <div className="absolute right-0 top-10 w-56 bg-white border border-[#E5E5EA] rounded-2xl shadow-xl z-50 overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-100">
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onOpenDownload();
                }}
                className="w-full text-left px-4 py-3 text-[15px] font-medium text-black active:bg-[var(--tg-theme-secondary-bg-color)] transition-colors flex items-center gap-3 cursor-pointer"
              >
                <Download
                  size={18}
                  className="text-[var(--tg-theme-button-color)]"
                />{" "}
                Документы чата
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onOpenExport();
                }}
                className="w-full text-left px-4 py-3 text-[15px] font-medium text-black active:bg-[var(--tg-theme-secondary-bg-color)] transition-colors flex items-center gap-3 cursor-pointer"
              >
                <Share2
                  size={18}
                  className="text-[var(--tg-theme-button-color)]"
                />{" "}
                Экспорт переписки
              </button>
              {chatId && chatId !== "new" && (
                <>
                  <div className="h-[1px] bg-[#E5E5EA] mx-4 my-1" />
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenDelete();
                    }}
                    className="w-full text-left px-4 py-3 text-[15px] font-medium text-[#FF3B30] active:bg-[var(--tg-theme-secondary-bg-color)] transition-colors flex items-center gap-3 cursor-pointer"
                  >
                    <Trash2 size={18} /> Удалить чат
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
