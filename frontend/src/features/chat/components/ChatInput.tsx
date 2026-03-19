// src/features/chat/components/ChatInput.tsx
import React from "react";
import { motion } from "motion/react";
import {
  X,
  FileText,
  Files,
  Paperclip,
  Loader2,
  ArrowUp,
  Sparkles,
  AlertTriangle, // Заменили Table на AlertTriangle
  ShieldAlert,
} from "lucide-react";
import { tgHaptic } from "../../../utils/telegram";

interface ChatInputProps {
  inputText: string;
  setInputText: (val: string) => void;
  isTyping: boolean;
  handleSend: (textOverride?: string) => void;
  oldFile: File | null;
  newFile: File | null;
  setOldFile: (val: File | null) => void;
  setNewFile: (val: File | null) => void;
  canAttachFiles: boolean;
  shouldShowAttachedIcon: boolean;
  onOpenCompareModal: () => void;
  onOpenFileLimitModal: () => void;
}

const QUICK_ACTIONS = [
  {
    id: "summary",
    label: "Выжимка",
    icon: Sparkles,
    prompt: "Сделай краткую выжимку главных изменений в документах.",
  },
  {
    id: "errors", // <-- Заменили Таблицу на Ошибки
    label: "Ошибки",
    icon: AlertTriangle,
    prompt:
      "Перечисли главные юридические ошибки и противоречия закону в новой редакции.",
  },
  {
    id: "risks",
    label: "Риски",
    icon: ShieldAlert,
    prompt:
      "Проигнорируй мелкие правки и найди только скрытые юридические риски в новой редакции.",
  },
];

export const ChatInput: React.FC<ChatInputProps> = ({
  inputText,
  setInputText,
  isTyping,
  handleSend,
  oldFile,
  newFile,
  setOldFile,
  setNewFile,
  canAttachFiles,
  shouldShowAttachedIcon,
  onOpenCompareModal,
  onOpenFileLimitModal,
}) => {
  const hasAttachedFiles = Boolean(oldFile && newFile);

  return (
    <div
      className="absolute bottom-0 left-0 w-full flex flex-col pt-2 px-4 backdrop-blur-xl bg-[var(--tg-theme-bg-color)]/90 border-t border-[var(--tg-theme-secondary-bg-color)] z-20"
      style={{ paddingBottom: "calc(1.5rem + var(--safe-bottom))" }}
    >
      {oldFile && newFile && (
        <div className="mb-3 w-full bg-[var(--tg-theme-secondary-bg-color)] border border-[var(--tg-theme-secondary-bg-color)] rounded-2xl p-3 flex flex-col gap-2 relative animate-in slide-in-from-bottom-2 duration-200 shadow-sm">
          <button
            onClick={() => {
              tgHaptic("light");
              setOldFile(null);
              setNewFile(null);
            }}
            className="absolute top-2 right-2 p-1 text-[var(--tg-theme-hint-color)] hover:text-[#FF3B30] transition-colors rounded-full cursor-pointer bg-[var(--tg-theme-bg-color)] shadow-sm"
          >
            <X size={16} />
          </button>
          <span className="text-[11px] font-semibold text-[var(--tg-theme-hint-color)] uppercase tracking-wider pl-1">
            Будут отправлены
          </span>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2.5 text-[14px] text-[var(--tg-theme-text-color)] truncate pr-6 bg-[var(--tg-theme-bg-color)] p-2 rounded-xl shadow-sm">
              <FileText
                size={18}
                className="text-[var(--tg-theme-button-color)] shrink-0"
              />
              <span className="truncate font-medium">{oldFile.name}</span>
            </div>
            <div className="flex items-center gap-2.5 text-[14px] text-[var(--tg-theme-text-color)] truncate pr-6 bg-[var(--tg-theme-bg-color)] p-2 rounded-xl shadow-sm">
              <FileText
                size={18}
                className="text-[var(--tg-theme-button-color)] shrink-0"
              />
              <span className="truncate font-medium">{newFile.name}</span>
            </div>
          </div>
        </div>
      )}

      {/* АНИМИРОВАННЫЕ ЧИПСЫ */}
      <div className="flex items-center justify-between gap-1.5 mb-3 w-full">
        {QUICK_ACTIONS.map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              type="button"
              onClick={() => {
                tgHaptic("light");
                handleSend(action.prompt);
              }}
              disabled={isTyping}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-[var(--tg-theme-secondary-bg-color)] hover:bg-[var(--tg-theme-secondary-bg-color)] active:bg-[var(--tg-theme-bg-color)] text-[var(--tg-theme-text-color)] rounded-xl text-[12px] font-medium transition-colors disabled:opacity-50 border border-[var(--tg-theme-secondary-bg-color)] min-w-0 shadow-sm"
            >
              <Icon
                size={12}
                className="text-[var(--tg-theme-button-color)] shrink-0"
              />
              <span className="truncate">{action.label}</span>
            </motion.button>
          );
        })}
      </div>

      <div className="flex items-end gap-2">
        <button
          type="button"
          onClick={() => {
            tgHaptic("light");
            if (!canAttachFiles) {
              onOpenFileLimitModal();
              return;
            }
            onOpenCompareModal();
          }}
          className={`w-10 h-10 mb-1 flex items-center justify-center rounded-full transition-colors shrink-0 cursor-pointer ${
            shouldShowAttachedIcon
              ? "text-[var(--tg-theme-button-color)] bg-[var(--tg-theme-button-color)]/10"
              : "text-[var(--tg-theme-hint-color)] hover:text-[var(--tg-theme-button-color)]"
          }`}
        >
          {shouldShowAttachedIcon ? (
            <Files size={22} />
          ) : (
            <Paperclip size={24} className="rotate-45" />
          )}
        </button>

        <div className="flex-1 bg-[var(--tg-theme-secondary-bg-color)] border border-transparent rounded-3xl min-h-[44px] max-h-[120px] flex items-end px-4 py-1.5 focus-within:border-[var(--tg-theme-button-color)] transition-colors">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                tgHaptic("medium");
                handleSend();
              }
            }}
            placeholder={
              hasAttachedFiles
                ? "Напишите сообщение..."
                : "Напишите сообщение..."
            }
            rows={1}
            className="flex-1 max-h-[100px] bg-transparent border-none outline-none text-[var(--tg-theme-text-color)] text-[16px] placeholder:text-[var(--tg-theme-hint-color)] resize-none py-1.5 select-text"
          />
        </div>

        <button
          type="button"
          onClick={() => {
            tgHaptic("medium");
            handleSend();
          }}
          disabled={isTyping || (!inputText.trim() && !hasAttachedFiles)}
          className={`w-[44px] h-[44px] shrink-0 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-sm mb-0.5
            ${
              inputText.trim() || hasAttachedFiles
                ? "bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)] shadow-blue-500/30"
                : "bg-[var(--tg-theme-secondary-bg-color)] text-[var(--tg-theme-hint-color)] cursor-not-allowed"
            }
          `}
        >
          {isTyping ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <ArrowUp size={20} strokeWidth={2.5} />
          )}
        </button>
      </div>
    </div>
  );
};
