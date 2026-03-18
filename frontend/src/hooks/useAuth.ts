// src/hooks/useAuth.ts
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { apiClient } from "../api/client";
import { TELEGRAM_USER } from "../utils/telegram";

// ГЛОБАЛЬНАЯ ПЕРЕМЕННАЯ: переживет любые перерисовки компонентов
let isAuthCheckedGlobally = false;

export const useAuth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(!isAuthCheckedGlobally);

  useEffect(() => {
    // Если уже проверяли авторизацию - просто выключаем лоадер и выходим
    if (isAuthCheckedGlobally) {
      setIsLoading(false);
      return;
    }

    isAuthCheckedGlobally = true;

    const checkAuthAndLoadProfile = async () => {
      try {
        const tgId = TELEGRAM_USER?.id;

        if (!tgId) {
          console.error("Telegram ID не найден!");
          setIsLoading(false);
          return;
        }

        const authResponse = await apiClient.auth({
          telegram_id: tgId,
          username: TELEGRAM_USER.username,
          first_name: TELEGRAM_USER.first_name,
          photo_url: TELEGRAM_USER.photo_url,
        });

        const profile = await apiClient.getUser(tgId);

        const safeProfile = {
          ...profile,
          first_name: profile.first_name || TELEGRAM_USER.first_name,
          username: profile.username || TELEGRAM_USER.username,
          photo_url: profile.photo_url || TELEGRAM_USER.photo_url,
        };

        localStorage.setItem("user", JSON.stringify(safeProfile));

        // Редиректы только если мы на корневой странице
        if (authResponse.is_new_user) {
          if (location.pathname !== "/") {
            navigate("/", { replace: true });
          }
        } else {
          if (location.pathname === "/") {
            navigate("/profile", { replace: true });
          }
        }
      } catch (err: any) {
        console.error("Ошибка авторизации:", err);
        localStorage.removeItem("user");
        if (location.pathname !== "/") {
          navigate("/", { replace: true });
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthAndLoadProfile();
  }, [navigate, location.pathname]);

  return { isLoading };
};
