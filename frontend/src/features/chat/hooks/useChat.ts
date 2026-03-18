// src/features/chat/hooks/useChat.ts
import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router";
import { apiClient } from "../../../api/client";
import { exportToDocx, exportToPdf } from "../../../utils/exportUtils";
// 👇 ИСПРАВЛЕНИЕ: Добавили tgHapticNotification в импорт
import { getTg, tgAlert, tgHapticNotification } from "../../../utils/telegram";

export const useChat = (chatId: string | undefined) => {
  const navigate = useNavigate();
  const location = useLocation();
  const userStr = localStorage.getItem("user");
  const internalUserId = userStr ? JSON.parse(userStr).id : null;

  // Основные стейты
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isCreatingChat = useRef(false);
  const hasHandledInitialPrompt = useRef(false);
  const [chatDocuments, setChatDocuments] = useState<any[]>([]);
  const [copiedMessageId, setCopiedMessageId] = useState<
    number | string | null
  >(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isUserScrollingUp, setIsUserScrollingUp] = useState(false);

  // Стейты файлов
  const [oldFile, setOldFile] = useState<File | null>(null);
  const [newFile, setNewFile] = useState<File | null>(null);

  // Стейты модалок
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isFileLimitModalOpen, setIsFileLimitModalOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Вычисляемые значения
  const hasAttachedFiles = Boolean(oldFile && newFile);
  const isFilesAttachedToChat = chatDocuments.length >= 2;
  const canAttachFiles = !isFilesAttachedToChat;
  const shouldShowAttachedIcon = hasAttachedFiles || isFilesAttachedToChat;

  const handleCopy = (text: string, id: number | string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const scrollToBottom = () => {
    // Скроллим вниз ТОЛЬКО если пользователь не читает старые сообщения
    if (!isUserScrollingUp) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Нативная кнопка Назад в Telegram
  useEffect(() => {
    const tg = getTg();
    if (tg && tg.BackButton) {
      tg.BackButton.show();
      const handleBack = () => navigate("/profile");
      tg.BackButton.onClick(handleBack);

      return () => {
        tg.BackButton.offClick(handleBack);
        tg.BackButton.hide();
      };
    }
  }, [navigate]);

  // Автоскролл при новых сообщениях
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, oldFile, newFile]);

  // Загрузка чата
  useEffect(() => {
    if (chatId === "new") {
      setMessages([]);
      setChatDocuments([]);
      setOldFile(null);
      setNewFile(null);
      setInputText("");
      hasHandledInitialPrompt.current = false;
      isCreatingChat.current = false;
    } else if (chatId) {
      if (isCreatingChat.current) {
        isCreatingChat.current = false;
        return;
      }
      Promise.all([
        apiClient.getChat(Number(chatId)),
        apiClient.getChatDocuments(Number(chatId)),
      ])
        .then(([chatRes, docsRes]) => {
          const historicalMessages = (chatRes.messages || []).map(
            (msg: any) => ({
              ...msg,
              isComplete: true,
            }),
          );
          setMessages(historicalMessages);
          setChatDocuments(docsRes || []);
        })
        .catch((err) => console.error("Failed to load chat or documents", err));
    }
  }, [chatId]);

  // Обработка initialPrompt (запуск чата с готовым текстом)
  useEffect(() => {
    const prompt = location.state?.initialPrompt;
    if (prompt && chatId === "new" && !hasHandledInitialPrompt.current) {
      hasHandledInitialPrompt.current = true;

      const newState = { ...location.state };
      delete newState.initialPrompt;

      navigate(location.pathname, { replace: true, state: newState });

      setTimeout(async () => {
        await handleSend(prompt);
      }, 150);
    }
  }, [location.state, chatId, navigate, location.pathname]);

  // Обработка автоматического открытия модалки (лимит файлов)
  useEffect(() => {
    if (location.state?.openCompareModal) {
      setIsCompareModalOpen(true);

      const newState = { ...location.state };
      delete newState.openCompareModal;

      navigate(location.pathname, { replace: true, state: newState });
    }
  }, [location.state, navigate, location.pathname]);

  const executeDeleteChat = async () => {
    if (!chatId || chatId === "new") return;
    try {
      await apiClient.deleteChat(Number(chatId));
      setIsDeleteModalOpen(false);
      navigate("/profile", { replace: true });
    } catch (error) {
      console.error("Failed to delete chat", error);
      tgAlert("Не удалось удалить чат. Пожалуйста, попробуйте еще раз.");
    }
  };

  const handleExport = async (format: "docx" | "pdf") => {
    setIsExporting(true);
    try {
      const chatTitle =
        messages[0]?.text.substring(0, 20).replace(/\s/g, "_") || "chat";
      const filename = `${chatTitle}_${new Date().toISOString().split("T")[0]}`;

      if (format === "docx") {
        exportToDocx(messages, `${filename}.docx`);
      } else {
        exportToPdf(messages, `${filename}.pdf`);
      }
    } catch (error) {
      console.error("Export failed", error);
      tgAlert("Не удалось экспортировать чат.");
    } finally {
      setTimeout(() => {
        setIsExporting(false);
        setIsExportModalOpen(false);
      }, 500);
    }
  };

  const handleSend = async (textOverride?: string | React.MouseEvent) => {
    const textToSend =
      typeof textOverride === "string" ? textOverride : inputText;

    if (!textToSend.trim() && !hasAttachedFiles) return;
    if (isTyping) return;

    setInputText("");
    setIsTyping(true);

    const finalPrompt = textToSend.trim();
    let activeChatId = chatId;

    try {
      if (activeChatId === "new" || !activeChatId) {
        if (!internalUserId) throw new Error("User ID not found");
        const chatTitle =
          hasAttachedFiles && oldFile
            ? `Сравнение: ${oldFile.name.substring(0, 10)}...`
            : finalPrompt.substring(0, 30) + "...";

        const newChat = await apiClient.createChat({
          user_id: internalUserId,
          title: chatTitle,
        });
        activeChatId = newChat.id.toString();
        isCreatingChat.current = true;
        navigate(`/chat/${activeChatId}`, { replace: true });
      }

      const userMsgId = `msg_${Date.now()}_user`;
      let userTextForUI = finalPrompt;

      if (hasAttachedFiles && oldFile && newFile) {
        userTextForUI = `Прикреплены документы для сравнения: 1. ${oldFile.name} 2. ${newFile.name}`;
        if (finalPrompt) {
          userTextForUI += `\n\n${finalPrompt}`;
        }
      }

      // Добавляем сообщение пользователя в UI
      setMessages((prev) => [
        ...prev,
        {
          id: userMsgId,
          role: "user",
          text: userTextForUI,
          created_at: new Date().toISOString(),
        },
      ]);

      const assistantMsgId = `msg_${Date.now()}_ai`;
      // УМНЫЙ ЛОАДЕР: Если прикреплены файлы, шлем "{", если обычный текст - шлем "..."
      const loadingTextPlaceholder =
        hasAttachedFiles && oldFile && newFile ? "{" : "...";

      setMessages((prev) => [
        ...prev,
        {
          id: assistantMsgId,
          role: "ai",
          text: loadingTextPlaceholder,
          created_at: new Date().toISOString(),
          isComplete: false,
        },
      ]);

      // Если есть файлы, отправляем их на бэк
      if (hasAttachedFiles && oldFile && newFile && internalUserId) {
        const uploadResponse = await apiClient.compareDocuments(
          Number(activeChatId),
          internalUserId,
          oldFile,
          newFile,
        );

        const newDocId = uploadResponse?.new_document_id || uploadResponse?.id;

        setChatDocuments((prev) => [
          ...prev,
          {
            id: newDocId ? newDocId - 1 : Date.now(),
            filename: oldFile.name,
          },
          { id: newDocId || Date.now() + 1, filename: newFile.name },
        ]);
      }

      // --- ИЩЕМ ID ПОСЛЕДНЕГО СООБЩЕНИЯ ---
      const lastRealMessage = [...messages]
        .reverse()
        .find((m) => typeof m.id === "number");
      const lastMessageId = lastRealMessage ? lastRealMessage.id : undefined;

      // Ждем полного ответа от бэкенда (без стриминга)
      const responseData = await apiClient.sendMessage(Number(activeChatId), {
        text: userTextForUI,
        comparison_id: lastMessageId,
      });

      let finalAiText = responseData.text || "";

      // Оборачиваем ответ в JSON, если пришли дифы, чтобы MessageBubble красиво их отрисовал
      if (responseData.diff_blocks && responseData.diff_blocks.length > 0) {
        finalAiText = JSON.stringify({
          analysis: {
            summary: responseData.text,
          },
          diff_blocks: responseData.diff_blocks,
        });

        // ВНИМАНИЕ: Нашли риски/дифы — вибрируем "Warning"
        tgHapticNotification("warning");
      } else {
        // Обычный текстовый ответ — вибрируем "Success"
        tgHapticNotification("success");
      }

      // Обновляем сообщение ИИ готовым текстом и снимаем статус загрузки
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? { ...msg, text: finalAiText, isComplete: true }
            : msg,
        ),
      );

      if (hasAttachedFiles) {
        setOldFile(null);
        setNewFile(null);
      }
    } catch (error) {
      console.error("Error sending message or uploading files:", error);
      // В случае ошибки тоже можно дать вибрацию
      tgHapticNotification("error");

      setMessages((prev) => [
        ...prev,
        {
          id: `msg_err_${Date.now()}`,
          role: "ai",
          text: "❌ Произошла ошибка при обработке запроса.",
          created_at: new Date().toISOString(),
          isComplete: true,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // Возвращаем всё, что нужно для UI
  return {
    messages,
    setMessages,
    inputText,
    setInputText,
    isTyping,
    messagesEndRef,
    chatDocuments,
    copiedMessageId,
    handleCopy,
    oldFile,
    setOldFile,
    newFile,
    setNewFile,
    isCompareModalOpen,
    setIsCompareModalOpen,
    isFileLimitModalOpen,
    setIsFileLimitModalOpen,
    isDownloadModalOpen,
    setIsDownloadModalOpen,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    isExportModalOpen,
    setIsExportModalOpen,
    isExporting,
    hasAttachedFiles,
    canAttachFiles,
    shouldShowAttachedIcon,
    executeDeleteChat,
    handleExport,
    handleSend,
    scrollContainerRef,
    setIsUserScrollingUp,
  };
};
