// src/App.tsx
import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router";
import { useAuth } from "./hooks/useAuth";
import { ToastProvider } from "./hooks/useToast";

import Onboarding from "./pages/Onboarding";
import Profile from "./pages/Profile";
import Chat from "./pages/Chat";
import Settings from "./pages/Settings";

function AuthRouter() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden bg-[var(--tg-theme-secondary-bg-color)]">
        <div className="absolute top-[30%] w-32 h-32 bg-[var(--tg-theme-button-color)] rounded-full blur-[80px] opacity-30" />
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--tg-theme-button-color)] z-10"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Onboarding />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/chat/:chatId" element={<Chat />} />
      <Route path="/settings" element={<Settings />} />
    </Routes>
  );
}

export default function App() {
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();

      // 👇 НОВАЯ ФИЧА: Запрос на открытие во весь экран (убирает шапку TG)
      if (tg.requestFullscreen) {
        tg.requestFullscreen();
      }

      // Отключаем закрытие приложения при случайном свайпе вниз по экрану
      if (tg.disableVerticalSwipes) {
        tg.disableVerticalSwipes();
      }

      // Красим хедер Telegram в цвет фона приложения
      if (tg.setHeaderColor) {
        tg.setHeaderColor("secondary_bg_color");
      }
    }
  }, []);

  return (
    <BrowserRouter>
      <ToastProvider>
        {/* Базовый фон центровщика */}
        <div className="min-h-screen bg-[var(--tg-theme-secondary-bg-color)] flex justify-center font-sans">
          {/* Ограничитель ширины для десктопа (max-w-md), на мобилках будет 100% */}
          <div className="w-full max-w-md bg-[var(--tg-theme-bg-color)] relative shadow-2xl overflow-hidden">
            <AuthRouter />
          </div>
        </div>
      </ToastProvider>
    </BrowserRouter>
  );
}
