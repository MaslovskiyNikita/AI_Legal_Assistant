import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { apiClient } from "../../../api/client";
import { agents } from "../data/agents";
import { TELEGRAM_USER, getTg, tgHaptic } from "../../../utils/telegram";

export const useProfile = () => {
  const navigate = useNavigate();
  const [selectedAgent, setSelectedAgent] = useState("strict");
  const [recentChats, setRecentChats] = useState<any[]>([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(true);
  const [greeting, setGreeting] = useState("Доброе утро");

  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const internalUserId = user?.id || null;

  const firstName =
    user?.first_name || user?.name || TELEGRAM_USER?.first_name || "User";
  const photoUrl = user?.photo_url || TELEGRAM_USER?.photo_url;

  const documentsAnalyzed = user?.documents_analyzed || 0;
  const consultationsCount = user?.consultations_count || 0;

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreeting("Доброе утро");
    else if (hour >= 12 && hour < 18) setGreeting("Добрый день");
    else if (hour >= 18 && hour < 23) setGreeting("Добрый вечер");
    else setGreeting("Доброй ночи");
  }, []);

  useEffect(() => {
    const tg = getTg();
    if (tg && tg.MainButton) {
      tg.MainButton.setParams({
        text: "НАЧАТЬ НОВЫЙ ЧАТ",
        color: "#3390EC",
        text_color: "#ffffff",
        is_visible: true,
      });

      const handleMainButtonClick = () => {
        tgHaptic("medium");
        const agent = agents.find((a) => a.id === selectedAgent);
        navigate("/chat/new", {
          state: {
            initialPrompt: agent?.prompt || "",
            tone: agent?.tone,
          },
        });
      };

      tg.MainButton.onClick(handleMainButtonClick);

      return () => {
        tg.MainButton.offClick(handleMainButtonClick);
        tg.MainButton.hide();
      };
    }
  }, [selectedAgent, navigate]);

  useEffect(() => {
    if (internalUserId) {
      setIsLoadingRecent(true);
      apiClient
        .getChats(internalUserId)
        .then((data) => {
          if (data && Array.isArray(data) && data.length > 0) {
            const sorted = data.sort((a: any, b: any) => {
              const dateA = a.created_at || a.createdAt || a.updated_at || null;
              const dateB = b.created_at || b.createdAt || b.updated_at || null;
              if (!dateA) return 1;
              if (!dateB) return -1;
              return new Date(dateB).getTime() - new Date(dateA).getTime();
            });

            const safeChats = sorted.map((chat) => ({
              ...chat,
              title: chat.title || chat.name || `Чат #${chat.id}`,
              name: chat.title || chat.name || `Чат #${chat.id}`,
            }));

            setRecentChats(safeChats.slice(0, 3));
          } else {
            setRecentChats([]);
          }
        })
        .catch((err) => console.error("Ошибка загрузки последних чатов", err))
        .finally(() => setIsLoadingRecent(false));
    } else {
      setIsLoadingRecent(false);
    }
  }, [internalUserId]);

  const startNewChat = () => {
    tgHaptic("medium");
    const agent = agents.find((a) => a.id === selectedAgent);
    navigate("/chat/new", {
      state: {
        initialPrompt: agent?.prompt || "",
        tone: agent?.tone,
      },
    });
  };

  return {
    internalUserId,
    documentsAnalyzed,
    consultationsCount,
    firstName,
    photoUrl,
    greeting,
    selectedAgent,
    setSelectedAgent,
    recentChats,
    isLoadingRecent,
    startNewChat,
    navigate,
  };
};
