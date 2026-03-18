// src/components/ui/Toast.tsx
import React, { useEffect } from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ id, message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(id), 4000); // Автозакрытие через 4 сек
    return () => clearTimeout(timer);
  }, [id, onClose]);

  const icons = {
    success: <CheckCircle2 className="text-[#34C759]" size={20} />,
    error: <AlertCircle className="text-[#FF3B30]" size={20} />,
    info: (
      <AlertCircle className="text-[var(--tg-theme-button-color)]" size={20} />
    ),
  };

  const bgColors = {
    success: "bg-[#E5F8EB] border-[#34C759]/30",
    error: "bg-[#FFEBEA] border-[#FF3B30]/30",
    info: "bg-[#E5F1FF] border-[#3390EC]/30",
  };

  return (
    <div
      className={`flex items-center gap-3 p-4 rounded-2xl border shadow-lg backdrop-blur-md animate-in slide-in-from-top-5 fade-in duration-300 ${bgColors[type]}`}
    >
      {icons[type]}
      <span className="text-[14px] font-medium text-[var(--tg-theme-text-color)] flex-1">
        {message}
      </span>
      <button
        onClick={() => onClose(id)}
        className="text-[var(--tg-theme-hint-color)] hover:text-[var(--tg-theme-text-color)] transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
};
