// src/App.tsx
import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { useAuth } from "./hooks/useAuth";
import { ToastProvider } from "./hooks/useToast";

import Onboarding from "./pages/Onboarding";
import Profile from "./pages/Profile";
import Chat from "./pages/Chat";
import Settings from "./pages/Settings";

// Обертка для красивых анимаций перехода между экранами
const PageTransition = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    // Начальное состояние (при появлении)
    initial={{ opacity: 0, x: 15 }}
    // Конечное состояние (когда страница на экране)
    animate={{ opacity: 1, x: 0 }}
    // Состояние при уходе (когда открываем другую страницу)
    exit={{ opacity: 0, x: -15 }}
    transition={{ duration: 0.25, ease: "easeOut" }}
    className="w-full min-h-screen flex flex-col bg-[var(--tg-theme-bg-color)]"
  >
    {children}
  </motion.div>
);

function AuthRouter() {
  const { isLoading } = useAuth();
  const location = useLocation(); // Следим за сменой URL для анимаций

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden bg-[var(--tg-theme-secondary-bg-color)]">
        <div className="absolute top-[30%] w-32 h-32 bg-[var(--tg-theme-button-color)] rounded-full blur-[80px] opacity-30" />
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--tg-theme-button-color)] z-10"></div>
      </div>
    );
  }

  return (
    // mode="wait" гарантирует, что старая страница исчезнет ПЕРЕД появлением новой
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

      // Отключаем закрытие приложения при случайном свайпе вниз
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
        <div className="min-h-screen bg-[var(--tg-theme-secondary-bg-color)] flex justify-center font-sans">
          <div className="w-full max-w-md bg-[var(--tg-theme-bg-color)] relative shadow-2xl overflow-hidden">
            <AuthRouter />
          </div>
        </div>
      </ToastProvider>
    </BrowserRouter>
  );
}
