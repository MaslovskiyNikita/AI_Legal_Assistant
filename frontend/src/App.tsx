// src/App.tsx
import React, { useEffect } from "react";
// 1. ИМПОРТИРУЕМ ОБРАТНО BrowserRouter 👇
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
      <div className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden bg-[#1C1C1D]">
        <div className="absolute top-[30%] w-32 h-32 bg-[#24A1DE] rounded-full blur-[80px] opacity-30" />
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#24A1DE] z-10"></div>
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
      // Отключаем закрытие приложения при случайном свайпе вниз по экрану
      if (tg.disableVerticalSwipes) {
        tg.disableVerticalSwipes();
      }
    }
  }, []);

  return (
    <BrowserRouter>
      <ToastProvider>
        {/* ЗАМЕНИЛИ bg-black и bg-[#1C1C1D] на переменные темы */}
        <div className="min-h-screen bg-[var(--tg-theme-secondary-bg-color)] flex justify-center font-sans">
          <div className="w-full max-w-md bg-[var(--tg-theme-bg-color)] relative shadow-2xl overflow-hidden">
            <AuthRouter />
          </div>
        </div>
      </ToastProvider>
    </BrowserRouter>
  );
}
