// src/features/settings/components/SettingsModals.tsx
import React from "react";
import { Loader2, X } from "lucide-react";

interface SettingsModalsProps {
  isClearHistoryModalOpen: boolean;
  setIsClearHistoryModalOpen: (val: boolean) => void;
  executeClearHistory: () => void;
  isClearing: boolean;
  isPrivacyModalOpen: boolean;
  setIsPrivacyModalOpen: (val: boolean) => void;
}

export const SettingsModals: React.FC<SettingsModalsProps> = (props) => (
  <>
    {props.isClearHistoryModalOpen && (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl w-full max-w-[300px] flex flex-col items-center text-center overflow-hidden animate-in zoom-in-95 duration-200 shadow-2xl">
          <div className="p-6 pb-5">
            <h2 className="text-[17px] font-semibold text-black mb-1.5">
              Очистить историю?
            </h2>
            <p className="text-[13px] text-[#8E8E93] leading-snug">
              Вы уверены, что хотите удалить все консультации? Это действие
              нельзя отменить.
            </p>
          </div>
          <div className="flex flex-col w-full border-t border-[#E5E5EA]">
            <button
              onClick={props.executeClearHistory}
              disabled={props.isClearing}
              className="w-full py-3.5 text-[17px] font-normal text-[#FF3B30] border-b border-[#E5E5EA] active:bg-[#F2F2F7] transition-colors flex items-center justify-center gap-2"
            >
              {props.isClearing ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                "Удалить все"
              )}
            </button>
            <button
              type="button"
              onClick={() => props.setIsClearHistoryModalOpen(false)}
              disabled={props.isClearing}
              className="w-full py-3.5 text-[17px] font-semibold text-[#3390EC] active:bg-[#F2F2F7] transition-colors"
            >
              Отмена
            </button>
          </div>
        </div>
      </div>
    )}

    {props.isPrivacyModalOpen && (
      <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-[500px] max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-300 shadow-2xl pb-safe">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#E5E5EA] shrink-0">
            <h2 className="text-[17px] font-semibold text-black">
              Политика конфиденциальности
            </h2>
            <button
              type="button"
              onClick={() => props.setIsPrivacyModalOpen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-[#F2F2F7] text-[#8E8E93] active:bg-[#E5E5EA] transition-colors"
            >
              <X size={18} />
            </button>
          </div>
          <div className="p-5 overflow-y-auto text-[15px] leading-relaxed text-[#3A3A3C] space-y-4">
            <p className="text-[13px] text-[#8E8E93] font-medium">
              Последнее обновление: {new Date().toLocaleDateString("ru-RU")}
            </p>
            <p>
              Это демонстрационная заглушка для политики конфиденциальности. В
              реальном приложении здесь будет размещен юридически значимый
              текст.
            </p>
          </div>
          <div className="p-4 border-t border-[#E5E5EA] bg-white shrink-0">
            <button
              type="button"
              onClick={() => props.setIsPrivacyModalOpen(false)}
              className="w-full py-3.5 bg-[#3390EC] text-white font-semibold rounded-xl active:bg-blue-600 transition-colors shadow-sm"
            >
              Понятно
            </button>
          </div>
        </div>
      </div>
    )}
  </>
);
