// src/features/settings/hooks/useSettings.ts
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { apiClient } from "../../../api/client";

export const useSettings = () => {
  const navigate = useNavigate();

  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const internalUserId = user?.id || null;
  const firstName = user?.first_name || "Пользователь";
  const username = user?.username ? `@${user.username}` : "Telegram ID скрыт";

  const [isClearHistoryModalOpen, setIsClearHistoryModalOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<"chats" | "documents">("chats");
  const [chats, setChats] = useState<any[]>([]);
  const [allDocuments, setAllDocuments] = useState<any[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [downloadingDocId, setDownloadingDocId] = useState<number | null>(null);

  const [theme, setTheme] = useState(user?.theme || "dark");
  const [notifications, setNotifications] = useState(
    user?.notifications_enabled ?? true,
  );

  const [filterPeriod, setFilterPeriod] = useState<
    "all" | "today" | "week" | "custom"
  >("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [showAllChats, setShowAllChats] = useState(false);
  const [showAllDocuments, setShowAllDocuments] = useState(false);

  const getChatDateStr = (chat: any) =>
    chat.created_at || chat.createdAt || chat.updated_at || null;

  useEffect(() => {
    if (internalUserId) {
      apiClient
        .getChats(internalUserId)
        .then(async (data) => {
          const sorted = (data || []).sort((a: any, b: any) => {
            const dateA = getChatDateStr(a);
            const dateB = getChatDateStr(b);
            if (!dateA) return 1;
            if (!dateB) return -1;
            return new Date(dateB).getTime() - new Date(dateA).getTime();
          });
          setChats(sorted);

          let docsArray: any[] = [];
          try {
            const docsPromises = sorted.map((chat: any) =>
              apiClient
                .getChatDocuments(chat.id)
                .then((docs) =>
                  docs.map((d: any) => ({
                    ...d,
                    chatTitle: chat.title,
                    chatId: chat.id,
                    chatDate: getChatDateStr(chat),
                  })),
                ),
            );
            const docsResults = await Promise.allSettled(docsPromises);
            docsResults.forEach((result) => {
              if (result.status === "fulfilled" && result.value) {
                docsArray = [...docsArray, ...result.value];
              }
            });
            docsArray.sort((a, b) => {
              const dateA = new Date(
                a.created_at || a.createdAt || a.updated_at || a.chatDate || 0,
              ).getTime();
              const dateB = new Date(
                b.created_at || b.createdAt || b.updated_at || b.chatDate || 0,
              ).getTime();
              return dateB - dateA;
            });
          } catch (err) {
            console.error("Ошибка при получении документов", err);
          }
          setAllDocuments(docsArray);
        })
        .finally(() => setIsLoadingStats(false));
    } else {
      setIsLoadingStats(false);
    }
  }, [internalUserId]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/", { replace: true });
  };

  const executeClearHistory = async () => {
    if (!internalUserId) return;
    setIsClearing(true);
    try {
      if (chats.length > 0) {
        await apiClient.deleteAllChats(internalUserId);
        setChats([]);
        setAllDocuments([]);
      }
      setIsClearHistoryModalOpen(false);
    } catch (error) {
      alert("Не удалось очистить историю.");
    } finally {
      setIsClearing(false);
    }
  };

  const handleDownload = async (
    e: React.MouseEvent,
    docId: number,
    filename: string,
  ) => {
    e.stopPropagation();
    setDownloadingDocId(docId);
    try {
      await apiClient.downloadDocument(docId, filename);
    } catch (err) {
      alert("Не удалось скачать файл");
    } finally {
      setDownloadingDocId(null);
    }
  };

  const toggleTheme = async () => {
    if (!internalUserId) return;
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    try {
      await apiClient.updateSettings(internalUserId, { theme: newTheme });
      localStorage.setItem(
        "user",
        JSON.stringify({ ...user, theme: newTheme }),
      );
    } catch (error) {
      setTheme(theme);
    }
  };

  const toggleNotifications = async () => {
    if (!internalUserId) return;
    const newNotifications = !notifications;
    setNotifications(newNotifications);
    try {
      await apiClient.updateSettings(internalUserId, {
        notifications_enabled: newNotifications,
      });
      localStorage.setItem(
        "user",
        JSON.stringify({ ...user, notifications_enabled: newNotifications }),
      );
    } catch (error) {
      setNotifications(notifications);
    }
  };

  const isDateInFilter = (dateStr: string | null) => {
    if (filterPeriod === "all") return true;
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    if (filterPeriod === "today") return date >= startOfToday;
    if (filterPeriod === "week") {
      const aWeekAgo = new Date(startOfToday);
      aWeekAgo.setDate(aWeekAgo.getDate() - 7);
      return date >= aWeekAgo;
    }
    if (filterPeriod === "custom") {
      if (!customStartDate && !customEndDate) return true;
      let isValid = true;
      if (customStartDate)
        isValid = isValid && date >= new Date(customStartDate);
      if (customEndDate) {
        const end = new Date(customEndDate);
        end.setHours(23, 59, 59, 999);
        isValid = isValid && date <= end;
      }
      return isValid;
    }
    return true;
  };

  const filteredChats = chats.filter((chat) =>
    isDateInFilter(getChatDateStr(chat)),
  );
  const displayedChats = showAllChats
    ? filteredChats
    : filteredChats.slice(0, 5);

  const filteredDocuments = allDocuments.filter((doc) =>
    isDateInFilter(
      doc.created_at || doc.createdAt || doc.updated_at || doc.chatDate || null,
    ),
  );
  const displayedDocuments = showAllDocuments
    ? filteredDocuments
    : filteredDocuments.slice(0, 5);

  return {
    firstName,
    username,
    activeTab,
    setActiveTab,
    chats,
    allDocuments,
    isLoadingStats,
    filterPeriod,
    setFilterPeriod,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    showAllChats,
    setShowAllChats,
    showAllDocuments,
    setShowAllDocuments,
    filteredChats,
    displayedChats,
    filteredDocuments,
    displayedDocuments,
    theme,
    toggleTheme,
    notifications,
    toggleNotifications,
    isClearHistoryModalOpen,
    setIsClearHistoryModalOpen,
    isClearing,
    executeClearHistory,
    isPrivacyModalOpen,
    setIsPrivacyModalOpen,
    handleLogout,
    downloadingDocId,
    handleDownload,
    navigate,
  };
};
