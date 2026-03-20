import React, { useState } from "react";
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
  onBack: () => void;
  onOpenDownload: () => void;
  onOpenExport: () => void;
  onOpenDelete: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  chatId,
  onBack,
  onOpenDownload,
  onOpenExport,
  onOpenDelete,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isWeb = !isTelegramWebApp();

  return (
    <div
      className="px-4 flex items-center justify-between sticky top-0 z-30 bg-[var(--tg-theme-bg-color)]/80 backdrop-blur-xl border-b border-[var(--tg-theme-secondary-bg-color)]"
      style={{
        paddingTop: "var(--safe-top)",
        minHeight: "calc(3.5rem + var(--safe-top))",
      }}
    >
      <div className="flex items-center z-10 w-8">
        {isWeb && (
          <button
            type="button"
            onClick={onBack}
            className="w-8 h-8 -ml-2 flex items-center justify-center text-[var(--tg-theme-button-color)] active:opacity-70 transition-opacity cursor-pointer"
          >
            <ChevronLeft size={28} />
          </button>
        )}
      </div>

      <span className="absolute left-1/2 -translate-x-1/2 text-[17px] font-semibold text-[var(--tg-theme-text-color)]">
        Legal Expert
      </span>

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
            <div className="absolute right-0 top-10 w-56 bg-[var(--tg-theme-bg-color)] border border-[var(--tg-theme-secondary-bg-color)] rounded-2xl shadow-xl z-50 overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-100">
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onOpenDownload();
                }}
                className="w-full text-left px-4 py-3 text-[15px] font-medium text-[var(--tg-theme-text-color)] active:bg-[var(--tg-theme-secondary-bg-color)] transition-colors flex items-center gap-3 cursor-pointer"
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
                className="w-full text-left px-4 py-3 text-[15px] font-medium text-[var(--tg-theme-text-color)] active:bg-[var(--tg-theme-secondary-bg-color)] transition-colors flex items-center gap-3 cursor-pointer"
              >
                <Share2
                  size={18}
                  className="text-[var(--tg-theme-button-color)]"
                />{" "}
                Экспорт переписки
              </button>
              {chatId && chatId !== "new" && (
                <>
                  <div className="h-[1px] bg-[var(--tg-theme-secondary-bg-color)] mx-4 my-1" />
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
