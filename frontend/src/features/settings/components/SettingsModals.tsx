// src/features/settings/components/SettingsModals.tsx
import React from "react";
import { Loader2, Trash2, ShieldCheck } from "lucide-react";
import { Drawer } from "vaul";
import { tgHaptic } from "../../../utils/telegram";

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
    {/* 1. Шторка: Очистка истории */}
    <Drawer.Root
      open={props.isClearHistoryModalOpen}
      onOpenChange={(open) => {
        if (open) tgHaptic("light");
        props.setIsClearHistoryModalOpen(open);
      }}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
        <Drawer.Content className="bg-white flex flex-col rounded-t-[24px] mt-24 fixed bottom-0 left-0 right-0 z-[60] outline-none">
          {/* Индикатор свайпа */}
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-[#E5E5EA] mt-4 mb-2" />

          <div className="p-5 pb-10">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-16 h-16 bg-[#FFEBEA] rounded-full flex items-center justify-center mb-4">
                <Trash2 size={28} className="text-[#FF3B30]" />
              </div>
              <Drawer.Title className="text-[20px] font-bold text-black mb-2">
                Очистить историю?
              </Drawer.Title>
              <Drawer.Description className="text-[15px] text-[#8E8E93] leading-snug max-w-[280px]">
                Вы уверены, что хотите удалить все консультации? Это действие
                нельзя отменить.
              </Drawer.Description>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  tgHaptic("rigid");
                  props.executeClearHistory();
                }}
                disabled={props.isClearing}
                className="w-full py-4 bg-[#FF3B30] text-white rounded-xl text-[17px] font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
              >
                {props.isClearing ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  "Удалить все"
                )}
              </button>
              <Drawer.Close asChild>
                <button
                  disabled={props.isClearing}
                  className="w-full py-4 bg-[#F2F2F7] text-black rounded-xl text-[17px] font-semibold active:scale-[0.98] transition-all"
                >
                  Отмена
                </button>
              </Drawer.Close>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>

    {/* 2. Шторка: Политика конфиденциальности */}
    <Drawer.Root
      open={props.isPrivacyModalOpen}
      onOpenChange={(open) => {
        if (open) tgHaptic("light");
        props.setIsPrivacyModalOpen(open);
      }}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
        <Drawer.Content className="bg-white flex flex-col rounded-t-[24px] mt-10 fixed bottom-0 left-0 right-0 z-[60] outline-none h-[85vh]">
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-[#E5E5EA] mt-4 mb-2" />

          <div className="px-5 pb-3 border-b border-[#E5E5EA] flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#F0F8FF] flex items-center justify-center shrink-0">
              <ShieldCheck size={20} className="text-[#3390EC]" />
            </div>
            <Drawer.Title className="text-[20px] font-bold text-black">
              Политика конфиденциальности
            </Drawer.Title>
            {/* Для доступности Vaul требует Description, скроем его визуально */}
            <Drawer.Description className="sr-only">
              Текст политики конфиденциальности
            </Drawer.Description>
          </div>

          <div className="flex-1 overflow-y-auto p-5 text-[15px] leading-relaxed text-[#3A3A3C] space-y-4">
            <p className="text-[13px] text-[#8E8E93] font-medium uppercase tracking-wider">
              Последнее обновление: {new Date().toLocaleDateString("ru-RU")}
            </p>
            <p>
              Это демонстрационная заглушка для политики конфиденциальности. В
              реальном приложении здесь будет размещен юридически значимый
              текст, описывающий сбор и хранение данных.
            </p>
            <p>
              Мы заботимся о вашей безопасности. Все загруженные документы
              удаляются с серверов после завершения сессии анализа (или иные
              условия).
            </p>
          </div>

          <div className="p-5 border-t border-[#E5E5EA]">
            <Drawer.Close asChild>
              <button className="w-full py-4 bg-[#3390EC] text-white font-semibold text-[17px] rounded-xl active:scale-[0.98] transition-all">
                Понятно
              </button>
            </Drawer.Close>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  </>
);
