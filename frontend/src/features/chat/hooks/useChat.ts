// src/features/chat/hooks/useChat.ts
import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router";
import { apiClient } from "../../../api/client";
import { exportToDocx, exportToPdf } from "../../../utils/exportUtils";
import { getTg, tgAlert } from "../../../utils/telegram";
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
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, oldFile, newFile]);

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

  // Обработка initialPrompt
  useEffect(() => {
    const prompt = location.state?.initialPrompt;
    if (prompt && chatId === "new" && !hasHandledInitialPrompt.current) {
      hasHandledInitialPrompt.current = true;
      const state = { ...location.state };
      delete state.initialPrompt;
      window.history.replaceState(state, document.title);
      setTimeout(async () => {
        await handleSend(prompt);
      }, 150);
    }
  }, [location.state?.initialPrompt, chatId]);

  // Обработка автоматического открытия модалки
  useEffect(() => {
    if (location.state?.openCompareModal) {
      setIsCompareModalOpen(true);
      const state = { ...location.state };
      delete state.openCompareModal;
      window.history.replaceState(state, document.title);
    }
  }, [location.state]);

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
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMsgId,
          role: "ai",
          text: "",
          created_at: new Date().toISOString(),
          isComplete: false,
        },
      ]);

      let comparisonId: number | undefined = undefined;

      if (hasAttachedFiles && oldFile && newFile && internalUserId) {
        const uploadResponse = await apiClient.compareDocuments(
          Number(activeChatId),
          internalUserId,
          oldFile,
          newFile,
        );
        comparisonId = uploadResponse?.new_document_id || uploadResponse?.id;
        setChatDocuments((prev) => [
          ...prev,
          {
            id: comparisonId ? comparisonId - 1 : Date.now(),
            filename: oldFile.name,
          },
          { id: comparisonId || Date.now() + 1, filename: newFile.name },
        ]);
      }

      await apiClient.sendMessageStream(
        Number(activeChatId),
        { text: userTextForUI, comparison_id: comparisonId },
        (chunk) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? { ...msg, text: (msg.text || "") + chunk }
                : msg,
            ),
          );
        },
      );

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId ? { ...msg, isComplete: true } : msg,
        ),
      );

      if (hasAttachedFiles) {
        setOldFile(null);
        setNewFile(null);
      }
    } catch (error) {
      console.error("Error sending message or uploading files:", error);
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
