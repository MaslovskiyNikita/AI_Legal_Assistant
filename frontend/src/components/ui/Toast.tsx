
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
    const timer = setTimeout(() => onClose(id), 4000); 
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
    success: "bg-[var(--tg-theme-bg-color)] border-[#34C759]/50",
    error: "bg-[var(--tg-theme-bg-color)] border-[#FF3B30]/50",
    info: "bg-[var(--tg-theme-bg-color)] border-[var(--tg-theme-button-color)]/50",
  };

  return (
    <div
      className={`flex items-center gap-3 p-4 rounded-2xl border shadow-xl animate-in slide-in-from-top-5 fade-in duration-300 ${bgColors[type]}`}
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
