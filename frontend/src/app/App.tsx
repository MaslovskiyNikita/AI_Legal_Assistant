import React, { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import Chat from "./pages/Chat";
import Onboarding from "./pages/Onboarding";
import { apiClient } from "./api/client";
import { TELEGRAM_USER } from "../utils/telegram"; // Убедись, что тут лежат данные из Telegram WebApp

function AuthRouter() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthAndLoadProfile = async () => {
      try {
        const tgId = TELEGRAM_USER?.id;

        if (!tgId) {
          console.error("Telegram ID не найден!");
          setLoading(false);
          return;
        }

        // 1. Шаг первый: Стучимся в /auth.
        // Передаем данные, которые ожидает твой UserAuthRequest на бэке.
        // Бэк либо создаст юзера, либо подтвердит старого.
        const authResponse = await apiClient.auth({
          telegram_id: tgId,
          username: TELEGRAM_USER.username,
          first_name: TELEGRAM_USER.first_name,
        });

        // 2. Шаг второй: Получаем полные данные профиля
        const profile = await apiClient.getUser(tgId);

        // 3. Сохраняем полного юзера (вместе с его внутренним id из БД) в localStorage
        localStorage.setItem("user", JSON.stringify(profile));

        // 4. Логика роутинга
        if (authResponse.is_new_user) {
          // Если юзер новый, кидаем его на страницу приветствия/онбординга (если он не там)
          if (location.pathname !== "/") {
            navigate("/", { replace: true });
          }
        } else {
          // Если юзер старый и находится на экране входа ("/"), пускаем сразу в профиль
          if (location.pathname === "/") {
            navigate("/profile", { replace: true });
          }
        }
      } catch (err: any) {
        console.error("Ошибка авторизации:", err);
        // Если вообще всё упало (например бэк лежит), выкидываем на старт
        localStorage.removeItem("user");
        if (location.pathname !== "/") {
          navigate("/", { replace: true });
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndLoadProfile();
  }, []);

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
      <Route path="/chat/new" element={<Chat />} />
      <Route path="/chat/:chatId" element={<Chat />} />
      <Route path="/settings" element={<Settings />} />
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
