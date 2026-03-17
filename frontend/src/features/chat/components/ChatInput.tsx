// src/features/chat/components/ChatInput.tsx
import React from "react";
import {
  X,
  FileText,
  Files,
  Paperclip,
  Loader2,
  ArrowUp,
  Sparkles,
  Table,
  ShieldAlert,
} from "lucide-react";

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

// Массив быстрых действий (Чипсы)
const QUICK_ACTIONS = [
  {
    id: "summary",
    label: "Выжимка", // Было "Сделать выжимку"
    icon: Sparkles,
    prompt: "Сделай краткую выжимку главных изменений в документах.",
  },
  {
    id: "table",
    label: "Таблица", // Было "В виде таблицы"
    icon: Table,
    prompt:
      "Покажи изменения в виде таблицы со столбцами: Было | Стало | Уровень риска.",
  },
  {
    id: "risks",
    label: "Риски", // Было "Скрытые риски"
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
    <div className="absolute bottom-0 left-0 w-full flex flex-col pt-2 pb-6 px-4 backdrop-blur-xl bg-white/90 border-t border-[#E5E5EA] z-20">
      {/* 1. Зона прикрепленных файлов (если есть) */}
      {oldFile && newFile && (
        <div className="mb-3 w-full bg-[#F2F2F7] border border-[#E5E5EA] rounded-2xl p-3 flex flex-col gap-2 relative animate-in slide-in-from-bottom-2 duration-200 shadow-sm">
          <button
            onClick={() => {
              setOldFile(null);
              setNewFile(null);
            }}
            className="absolute top-2 right-2 p-1 text-[#8E8E93] hover:text-[#FF3B30] transition-colors rounded-full cursor-pointer bg-white shadow-sm"
            title="Открепить файлы"
          >
            <X size={16} />
          </button>
          <span className="text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider pl-1">
            Будут отправлены
          </span>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2.5 text-[14px] text-black truncate pr-6 bg-white p-2 rounded-xl shadow-sm">
              <FileText size={18} className="text-[#3390EC] shrink-0" />
              <span className="truncate font-medium">{oldFile.name}</span>
            </div>
            <div className="flex items-center gap-2.5 text-[14px] text-black truncate pr-6 bg-white p-2 rounded-xl shadow-sm">
              <FileText size={18} className="text-[#3390EC] shrink-0" />
              <span className="truncate font-medium">{newFile.name}</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. НОВОЕ: Быстрые действия (Чипсы) */}
      <div className="flex items-center justify-between gap-1.5 mb-3 w-full">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              type="button"
              onClick={() => handleSend(action.prompt)}
              disabled={isTyping}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-[#F2F2F7] hover:bg-[#E5E5EA] active:bg-[#D1D1D6] text-[#3A3A3C] rounded-xl text-[12px] font-medium transition-colors disabled:opacity-50 border border-[#E5E5EA] min-w-0"
            >
              <Icon size={12} className="text-[#3390EC] shrink-0" />
              <span className="truncate">{action.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Основная строка ввода */}
      <div className="flex items-end gap-2">
        <button
          type="button"
          onClick={() => {
            if (!canAttachFiles) {
              onOpenFileLimitModal();
              return;
            }
            onOpenCompareModal();
          }}
          className={`w-10 h-10 mb-1 flex items-center justify-center rounded-full transition-colors shrink-0 cursor-pointer ${
            shouldShowAttachedIcon
              ? "text-[#3390EC] bg-[#E5F1FF]"
              : "text-[#8E8E93] hover:text-[#3390EC]"
          }`}
        >
          {shouldShowAttachedIcon ? (
            <Files size={22} />
          ) : (
            <Paperclip size={24} className="rotate-45" />
          )}
        </button>

        <div className="flex-1 bg-[#F2F2F7] border border-[#E5E5EA] rounded-3xl min-h-[44px] max-h-[120px] flex items-end px-4 py-1.5 focus-within:border-[#3390EC] transition-colors">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={
              hasAttachedFiles
                ? "Напишите сообщение..."
                : "Напишите сообщение..."
            }
            rows={1}
            className="flex-1 max-h-[100px] bg-transparent border-none outline-none text-black text-[16px] placeholder:text-[#8E8E93] resize-none py-1.5"
          />
        </div>

        <button
          onClick={() => handleSend()}
          disabled={isTyping || (!inputText.trim() && !hasAttachedFiles)}
          className={`w-[44px] h-[44px] shrink-0 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-sm mb-0.5
            ${
              inputText.trim() || hasAttachedFiles
                ? "bg-[#3390EC] text-white shadow-blue-500/30"
                : "bg-[#E5E5EA] text-[#8E8E93] cursor-not-allowed"
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
