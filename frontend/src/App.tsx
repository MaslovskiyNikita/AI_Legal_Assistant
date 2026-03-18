// src/App.tsx
import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router";
// ИМПОРТИРУЕМ MOTION ДЛЯ АНИМАЦИЙ 👇
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "./hooks/useAuth";
import { ToastProvider } from "./hooks/useToast";

import Onboarding from "./pages/Onboarding";
import Profile from "./pages/Profile";
import Chat from "./pages/Chat";
import Settings from "./pages/Settings";

// 1. Создаем универсальную обертку для страниц с Apple-подобной анимацией
const PageTransition = ({ children }: { children: React.ReactNode }) => {
  return (
    <motion.div
      // Начальное состояние (при появлении страницы)
      initial={{ opacity: 0, y: 15, scale: 0.98 }}
      // Конечное состояние (когда страница на экране)
      animate={{ opacity: 1, y: 0, scale: 1 }}
      // Состояние при уходе со страницы
      exit={{ opacity: 0, y: -15, scale: 0.98 }}
      // Настройки плавности (пружинная анимация как в iOS)
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="w-full h-full flex flex-col"
    >
      {children}
    </motion.div>
  );
};

// 2. Модифицируем роутер: добавляем useLocation и AnimatePresence
function AnimatedRoutes() {
  const location = useLocation(); // Теперь роутер знает, на какой мы странице
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
    // AnimatePresence с mode="wait" ждет, пока старая страница исчезнет, прежде чем показать новую
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <PageTransition>
              <Onboarding />
            </PageTransition>
          }
        />
        <Route
          path="/profile"
          element={
            <PageTransition>
              <Profile />
            </PageTransition>
          }
        />
        <Route
          path="/chat/:chatId"
          element={
            <PageTransition>
              <Chat />
            </PageTransition>
          }
        />
        <Route
          path="/settings"
          element={
            <PageTransition>
              <Settings />
            </PageTransition>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
    }
  }, []);

  return (
    <BrowserRouter>
      <ToastProvider>
        <div className="min-h-screen bg-black flex justify-center font-sans">
          <div className="w-full max-w-md bg-[#1C1C1D] relative shadow-2xl overflow-hidden">
            {/* Используем наш анимированный роутер */}
            <AnimatedRoutes />
          </div>
        </div>
      </ToastProvider>
    </BrowserRouter>
  );
}
