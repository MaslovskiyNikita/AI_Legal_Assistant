import React, { useState } from "react";
import { Zap, ChevronRight, Star, Loader2 } from "lucide-react";
import { Drawer } from "vaul";
import {
  TELEGRAM_USER,
  tgOpenInvoice,
  tgHapticNotification,
  tgHaptic,
} from "../../../utils/telegram";
import { apiClient } from "../../../api/client";
import { useToast } from "../../../hooks/useToast";

const PACKAGES = [
  { id: "pack_100", tokens: 100, stars: 15 },
  { id: "pack_500", tokens: 500, stars: 60, popular: true },
  { id: "pack_1000", tokens: 1000, stars: 100 },
];

const TokenCircleMenu = ({ balance }: { balance: number }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loadingPack, setLoadingPack] = useState<string | null>(null);
  const { showToast } = useToast();

  const handleBuy = async (packageId: string) => {
    if (!TELEGRAM_USER?.id) return;

    tgHaptic("light");
    setLoadingPack(packageId);

    try {
      // 1. Запрашиваем ссылку на инвойс у бэкенда
      const { invoice_link } = await apiClient.createStarsInvoice(
        TELEGRAM_USER.id,
        packageId,
      );

      // 2. Открываем нативное окно оплаты Telegram
      tgOpenInvoice(invoice_link, async (status) => {
        if (status === "paid") {
          tgHapticNotification("success");
          setIsOpen(false);
          showToast(
            "Оплата прошла успешно! Токены скоро поступят на баланс.",
            "success",
          );

          // Здесь в будущем можно дернуть ручку обновления профиля,
          // чтобы баланс обновился на экране мгновенно
        } else if (status === "cancelled") {
          showToast("Оплата отменена", "info");
        } else {
          showToast("Произошла ошибка при оплате", "error");
        }
        setLoadingPack(null);
      });
    } catch (e) {
      showToast("Не удалось создать счет", "error");
      setLoadingPack(null);
    }
  };

  return (
    <>
      <div
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--tg-theme-secondary-bg-color)] rounded-full border border-[var(--tg-theme-section-separator-color,rgba(128,128,128,0.2))] cursor-pointer active:scale-95 transition-all shadow-sm"
      >
        <Zap size={14} className="text-[#FFCC00] fill-current" />
        <span className="text-[13px] font-bold text-[var(--tg-theme-text-color)]">
          {balance}
        </span>
      </div>

      {/* Шторка пополнения баланса */}
      <Drawer.Root open={isOpen} onOpenChange={setIsOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
          <Drawer.Content className="bg-[var(--tg-theme-bg-color)] flex flex-col rounded-t-[24px] mt-24 fixed bottom-0 left-0 right-0 z-[60] outline-none">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-[var(--tg-theme-hint-color)] opacity-20 mt-4 mb-2" />

            <div className="p-5 pb-10">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-16 h-16 bg-[#FFF9E5] rounded-full flex items-center justify-center mb-4">
                  <Zap size={28} className="text-[#FFCC00] fill-current" />
                </div>
                <Drawer.Title className="text-[20px] font-bold text-[var(--tg-theme-text-color)] mb-2">
                  Пополнить токены
                </Drawer.Title>
                <Drawer.Description className="text-[14px] text-[var(--tg-theme-hint-color)] leading-snug">
                  Токены расходуются на AI-анализ документов. Оплата происходит
                  мгновенно через Telegram Stars.
                </Drawer.Description>
              </div>

              <div className="flex flex-col gap-3">
                {PACKAGES.map((pack) => (
                  <button
                    key={pack.id}
                    onClick={() => handleBuy(pack.id)}
                    disabled={loadingPack !== null}
                    className={`w-full relative flex items-center justify-between p-4 rounded-2xl border transition-all active:scale-[0.98] ${
                      pack.popular
                        ? "bg-[color-mix(in_srgb,var(--tg-theme-button-color)_10%,transparent)] border-[var(--tg-theme-button-color)]"
                        : "bg-[var(--tg-theme-secondary-bg-color)] border-transparent"
                    }`}
                  >
                    {pack.popular && (
                      <span className="absolute -top-2.5 left-4 bg-[var(--tg-theme-button-color)] text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                        Выгодно
                      </span>
                    )}

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--tg-theme-bg-color)] shadow-sm flex items-center justify-center">
                        <Zap size={18} className="text-[#FFCC00]" />
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="text-[16px] font-bold text-[var(--tg-theme-text-color)]">
                          {pack.tokens} токенов
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color,white)] px-3 py-1.5 rounded-full font-bold text-[14px]">
                      {loadingPack === pack.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <>
                          {pack.stars}{" "}
                          <Star size={14} className="fill-current" />
                        </>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  );
};

export const ProfileHeader: React.FC<{
  firstName: string;
  photoUrl?: string | null;
  greeting: string;
  onSettingsClick: () => void;
}> = ({ firstName, photoUrl, greeting, onSettingsClick }) => {
  // Заглушка, позже сюда нужно передавать реальный tokens_balance из контекста/пропсов
  const userStr = localStorage.getItem("user");
  const balance = userStr ? JSON.parse(userStr).tokens_balance || 50 : 50;

  return (
    <div className="flex items-center justify-between px-4 pt-4 pb-3 relative z-20">
      <div
        className="flex items-center gap-3 cursor-pointer"
        onClick={onSettingsClick}
      >
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={firstName}
            className="w-10 h-10 rounded-full object-cover shadow-sm"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-[var(--tg-theme-button-color)] flex items-center justify-center text-white font-medium text-lg shadow-sm">
            {firstName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex flex-col">
          <span className="text-[16px] font-semibold leading-tight text-[var(--tg-theme-text-color)]">
            {firstName}
          </span>
          <span className="text-[13px] text-[var(--tg-theme-hint-color)]">
            {greeting}
          </span>
        </div>
      </div>
      <TokenCircleMenu balance={balance} />
    </div>
  );
};
