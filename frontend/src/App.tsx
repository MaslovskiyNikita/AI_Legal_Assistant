// src/App.tsx
import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { useAuth } from "./hooks/useAuth";
import { ToastProvider } from "./hooks/useToast";
import { applyThemeToApp } from "./utils/telegram";
import Onboarding from "./pages/Onboarding";
import Profile from "./pages/Profile";
import Chat from "./pages/Chat";
import Settings from "./pages/Settings";

const PageTransition = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, x: 15 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -15 }}
    transition={{ duration: 0.25, ease: "easeOut" }}
    className="w-full min-h-screen flex flex-col bg-[var(--tg-theme-bg-color)]"
  >
    {children}
  </motion.div>
);

function AuthRouter() {
  const { isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden bg-[var(--tg-theme-secondary-bg-color)]">
        <div className="absolute top-[30%] w-32 h-32 bg-[var(--tg-theme-button-color)] rounded-full blur-[80px] opacity-30" />
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--tg-theme-button-color)] z-10"></div>
      </div>
    );
  }

  // Надежный ключ: все роуты внутри /chat/ считаются одной страницей для аниматора
  const routeKey = location.pathname.split("/")[1] || "/";

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={routeKey}>
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

    const userStr = localStorage.getItem("user");
    const userTheme = userStr ? JSON.parse(userStr).theme : null;

    // ИЗМЕНЕНО: Больше не смотрим на tg?.colorScheme
    const finalTheme = userTheme || "dark";
    applyThemeToApp(finalTheme);

    if (tg) {
      tg.ready();
      tg.expand();
      if (tg.disableVerticalSwipes) tg.disableVerticalSwipes();
    }
  }, []);

  return (
    <BrowserRouter>
      <ToastProvider>
        <div className="min-h-screen bg-[var(--tg-theme-secondary-bg-color)] flex justify-center font-sans select-none touch-manipulation">
          <div className="w-full max-w-md bg-[var(--tg-theme-bg-color)] relative shadow-2xl overflow-hidden">
            <AuthRouter />
          </div>
        </div>
      </ToastProvider>
    </BrowserRouter>
  );
}
