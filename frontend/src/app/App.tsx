import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router";

import Profile from "./pages/Profile";
import Chat from "./pages/Chat";
import Onboarding from "./pages/Onboarding";
import { apiClient } from "./api/client";
import { TELEGRAM_USER } from "../utils/telegram";

function AuthRouter() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      // 1. Проверяем локальный сторадж, если юзер уже логинился
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user && user.telegram_id) {
            navigate("/profile", { replace: true });
            setLoading(false);
            return;
          }
        } catch (e) {}
      }

      // 2. Идем в бэкенд проверять по telegram_id
      try {
        const profile = await apiClient.getUser(TELEGRAM_USER.id as any);
        // Если getUser не упал с ошибкой, значит юзер ЕСТЬ в базе
        localStorage.setItem("user", JSON.stringify(profile));
        navigate("/profile", { replace: true });
      } catch (err: any) {
        // 3. Юзера нет в базе (404 ошибка от getUser) -> он новый
        // Оставляем его на текущем маршруте
        navigate("/", { replace: true });
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden bg-[#1C1C1D]">
        <div className="absolute top-[30%] w-32 h-32 bg-[#3390EC] rounded-full blur-[80px] opacity-30" />
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3390EC] z-10"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Onboarding />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/chat/:chatId" element={<Chat />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-black flex justify-center font-sans">
        <div className="w-full max-w-md bg-[#1C1C1D] relative shadow-2xl overflow-hidden">
          <AuthRouter />
        </div>
      </div>
    </BrowserRouter>
  );
}
