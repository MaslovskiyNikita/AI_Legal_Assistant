// src/features/profile/components/ProfileHeader.tsx
import React, { useState } from "react";
import { Zap, ChevronLeft, Star, Loader2, Clock, Info } from "lucide-react";
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

const MAX_FREE_TOKENS = 100;

const TokenCircleMenu = ({
  balance,
  onPaymentSuccess,
}: {
  balance: number;
  onPaymentSuccess: () => Promise<void>;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<"info" | "store">("info");
  const [loadingPack, setLoadingPack] = useState<string | null>(null);
  const { showToast } = useToast();

  const percent = Math.min(Math.max((balance / MAX_FREE_TOKENS) * 100, 0), 100);
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  let strokeColor = "#34C759";
  if (percent <= 50 && percent > 20) strokeColor = "#FF9500";
  if (percent <= 20) strokeColor = "#FF3B30";

  const handleOpen = () => {
    tgHaptic("light");
    setView("info");
    setIsOpen(true);
  };

  const handleBuy = async (packageId: string) => {
    if (!TELEGRAM_USER?.id) return;

    tgHaptic("light");
    setLoadingPack(packageId);

    try {
      const { invoice_url } = await apiClient.createStarsInvoice(
        TELEGRAM_USER.id,
        packageId,
      );

      tgOpenInvoice(invoice_url, async (status) => {
        if (status === "paid") {
          tgHapticNotification("success");
          setIsOpen(false);
          showToast("Оплата прошла успешно! Проверяем баланс...", "info");

          // Даем бэкенду 2 секунды на обработку вебхука от Telegram
          setTimeout(async () => {
            await onPaymentSuccess();
            showToast("Баланс успешно обновлен!", "success");
          }, 2000);
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
        onClick={handleOpen}
        className="relative flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
      >
        <svg className="-rotate-90 transform w-11 h-11">
          <circle
            cx="22"
            cy="22"
            r={radius}
            stroke="currentColor"
            strokeWidth="3.5"
            fill="transparent"
            className="text-[var(--tg-theme-secondary-bg-color)]"
          />
          <circle
            cx="22"
            cy="22"
            r={radius}
            stroke={strokeColor}
            strokeWidth="3.5"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-in-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <Zap size={14} fill={strokeColor} className="text-transparent" />
        </div>
      </div>

      <Drawer.Root open={isOpen} onOpenChange={setIsOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]" />
          <Drawer.Content className="bg-[var(--tg-theme-bg-color)] flex flex-col rounded-t-[24px] mt-24 fixed bottom-0 left-0 right-0 z-[110] outline-none">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-[var(--tg-theme-hint-color)] opacity-20 mt-4 mb-2" />

            <div className="p-5 pb-10">
              {view === "info" && (
                <div className="flex flex-col animate-in fade-in slide-in-from-left-4 duration-300">
                  <div className="flex flex-col items-center text-center mb-6">
                    <div className="text-[56px] font-bold text-[var(--tg-theme-text-color)] leading-none mb-1 tracking-tight">
                      {balance}
                    </div>
                    <span className="text-[15px] text-[var(--tg-theme-hint-color)] font-medium uppercase tracking-wider">
                      Токенов доступно
                    </span>
                  </div>

                  <div className="bg-[var(--tg-theme-secondary-bg-color)] rounded-2xl p-4 mb-6 border border-[var(--tg-theme-section-separator-color,rgba(128,128,128,0.2))]">
                    <div className="flex gap-3 mb-2">
                      <Clock
                        size={20}
                        className="text-[var(--tg-theme-button-color)] shrink-0 mt-0.5"
                      />
                      <p className="text-[15px] font-semibold text-[var(--tg-theme-text-color)] leading-snug">
                        Бесплатные лимиты обновятся через 4 часа
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Info
                        size={20}
                        className="text-[var(--tg-theme-hint-color)] shrink-0 mt-0.5"
                      />
                      <p className="text-[14px] text-[var(--tg-theme-hint-color)] leading-snug">
                        Каждый день вам начисляются базовые токены для анализа
                        небольших документов.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      tgHaptic("light");
                      setView("store");
                    }}
                    className="w-full bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color,white)] rounded-xl py-4 text-[17px] font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-md shadow-blue-500/20"
                  >
                    <Zap size={20} fill="currentColor" /> Купить дополнительные
                  </button>
                </div>
              )}

              {view === "store" && (
                <div className="flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center gap-3 mb-6">
                    <button
                      onClick={() => {
                        tgHaptic("light");
                        setView("info");
                      }}
                      className="w-8 h-8 flex items-center justify-center bg-[var(--tg-theme-secondary-bg-color)] rounded-full text-[var(--tg-theme-button-color)]"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <div>
                      <Drawer.Title className="text-[20px] font-bold text-[var(--tg-theme-text-color)] leading-tight">
                        Пополнить токены
                      </Drawer.Title>
                      <Drawer.Description className="text-[13px] text-[var(--tg-theme-hint-color)]">
                        Оплата через Telegram Stars
                      </Drawer.Description>
                    </div>
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
                            : "bg-[var(--tg-theme-secondary-bg-color)] border-[var(--tg-theme-section-separator-color,rgba(128,128,128,0.2))]"
                        }`}
                      >
                        {pack.popular && (
                          <span className="absolute -top-2.5 left-4 bg-[var(--tg-theme-button-color)] text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">
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

                        <div className="flex items-center gap-1.5 bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color,white)] px-3 py-1.5 rounded-full font-bold text-[14px] shadow-sm">
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
              )}
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
  // Инициализируем состояние баланса
  const [balance, setBalance] = useState(() => {
    const userStr = localStorage.getItem("user");
    return userStr ? (JSON.parse(userStr).token_balance ?? 50) : 50;
  });

  // Функция для запроса новых данных с бэкенда
  const fetchFreshBalance = async () => {
    if (!TELEGRAM_USER?.id) return;
    try {
      const freshProfile = await apiClient.getUser(TELEGRAM_USER.id);

      // Обновляем LocalStorage
      const oldUser = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem(
        "user",
        JSON.stringify({ ...oldUser, ...freshProfile }),
      );

      // Обновляем стейт компонента (чтобы перерисовался интерфейс)
      setBalance(freshProfile.token_balance ?? balance);
    } catch (e) {
      console.error("Не удалось обновить баланс:", e);
    }
  };

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
            className="w-10 h-10 rounded-full object-cover shadow-sm border border-[var(--tg-theme-section-separator-color,rgba(128,128,128,0.2))]"
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
      <TokenCircleMenu balance={balance} onPaymentSuccess={fetchFreshBalance} />
    </div>
  );
};
