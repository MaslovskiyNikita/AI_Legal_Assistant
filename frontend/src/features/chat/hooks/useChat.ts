// src/features/chat/hooks/useChat.ts
import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router";
import { apiClient } from "../../../api/client";
import { exportToDocx, exportToPdf } from "../../../utils/exportUtils";
import { getTg, tgAlert, tgHapticNotification } from "../../../utils/telegram";

// Импортируем наши новые микро-хуки
import { useChatModals } from "./useChatModals";
import { useChatFiles } from "./useChatFiles";
import { useChatMessages } from "./useChatMessages";

export const useChat = (chatId: string | undefined) => {
  const navigate = useNavigate();
  const location = useLocation();
  const userStr = localStorage.getItem("user");
  const internalUserId = userStr ? JSON.parse(userStr).id : null;

  // 1. ИНИЦИАЛИЗАЦИЯ МИКРО-ХУКОВ
  const modals = useChatModals();
  const files = useChatFiles();
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const chatMessages = useChatMessages(
    chatId,
    isTyping,
    files.hasAttachedFiles,
  );

  const isCreatingChat = useRef(false);
  const hasHandledInitialPrompt = useRef(false);

  // 2. НАТИВНАЯ КНОПКА "НАЗАД"
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

  // 3. ЗАГРУЗКА ИСТОРИИ ЧАТА
  // 3. ЗАГРУЗКА ИСТОРИИ ЧАТА
  useEffect(() => {
    if (chatId === "new") {
      chatMessages.setMessages([]);
      files.setChatDocuments([]);
      files.setOldFile(null);
      files.setNewFile(null);
      setInputText("");
      hasHandledInitialPrompt.current = false;
      isCreatingChat.current = false;
    } else if (chatId) {
      if (isCreatingChat.current) {
        isCreatingChat.current = false;
        return;
      }
      if (isTyping) return;

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
          chatMessages.setMessages(historicalMessages);
          files.setChatDocuments(docsRes || []);
        })
        .catch((err) => console.error("Failed to load chat", err));
    }
  }, [chatId, isTyping]); // <-- Добавили isTyping в зависимости

  // Обработка initialPrompt и открытия модалок из роутера
  useEffect(() => {
    const prompt = location.state?.initialPrompt;
    if (prompt && chatId === "new" && !hasHandledInitialPrompt.current) {
      hasHandledInitialPrompt.current = true;
      const newState = { ...location.state };
      delete newState.initialPrompt;
      navigate(location.pathname, { replace: true, state: newState });
      setTimeout(() => handleSend(prompt), 150);
    }
  }, [location.state, chatId, navigate, location.pathname]);

  useEffect(() => {
    if (location.state?.openCompareModal) {
      modals.setIsCompareModalOpen(true);
      const newState = { ...location.state };
      delete newState.openCompareModal;
      navigate(location.pathname, { replace: true, state: newState });
    }
  }, [location.state, navigate, location.pathname]);

  // 4. ЭКСПОРТ И УДАЛЕНИЕ ЧАТА
  const executeDeleteChat = async () => {
    if (!chatId || chatId === "new") return;
    try {
      await apiClient.deleteChat(Number(chatId));
      modals.setIsDeleteModalOpen(false);
      navigate("/profile", { replace: true });
    } catch (error) {
      tgAlert("Не удалось удалить чат. Попробуйте еще раз.");
    }
  };

  const handleExport = async (format: "docx" | "pdf") => {
    files.setIsExporting(true); // <-- ИСПРАВЛЕНО (было modals.setIsExporting)
    try {
      const chatTitle =
        chatMessages.messages[0]?.text.substring(0, 20).replace(/\s/g, "_") ||
        "chat";
      const filename = `${chatTitle}_${new Date().toISOString().split("T")[0]}`;
      if (format === "docx")
        exportToDocx(chatMessages.messages, `${filename}.docx`);
      else exportToPdf(chatMessages.messages, `${filename}.pdf`);
    } catch (error) {
      tgAlert("Не удалось экспортировать чат.");
    } finally {
      setTimeout(() => {
        files.setIsExporting(false); // <-- ИСПРАВЛЕНО (было modals.setIsExporting)
        modals.setIsExportModalOpen(false);
      }, 500);
    }
  };

  // 5. ГЛАВНАЯ БИЗНЕС-ЛОГИКА (ОТПРАВКА СООБЩЕНИЯ)
  const handleSend = async (textOverride?: string | React.MouseEvent) => {
    const textToSend =
      typeof textOverride === "string" ? textOverride : inputText;
    if (!textToSend.trim() && !files.hasAttachedFiles) return;
    if (isTyping) return;

    setInputText("");
    setIsTyping(true);
    const finalPrompt = textToSend.trim();
    let activeChatId = chatId;

    try {
      if (activeChatId === "new" || !activeChatId) {
        if (!internalUserId) throw new Error("User ID not found");
        const chatTitle =
          files.hasAttachedFiles && files.oldFile
            ? `Сравнение: ${files.oldFile.name.substring(0, 10)}...`
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

      if (files.hasAttachedFiles && files.oldFile && files.newFile) {
        userTextForUI = `Прикреплены документы для сравнения: 1. ${files.oldFile.name} 2. ${files.newFile.name}`;
        if (finalPrompt) userTextForUI += `\n\n${finalPrompt}`;
      }

      chatMessages.setMessages((prev) => [
        ...prev,
        {
          id: userMsgId,
          role: "user",
          text: userTextForUI,
          created_at: new Date().toISOString(),
        },
      ]);

      const assistantMsgId = `msg_${Date.now()}_ai`;
      const loadingTextPlaceholder =
        files.hasAttachedFiles && files.oldFile && files.newFile ? "{" : "...";

      chatMessages.setMessages((prev) => [
        ...prev,
        {
          id: assistantMsgId,
          role: "ai",
          text: loadingTextPlaceholder,
          created_at: new Date().toISOString(),
          isComplete: false,
        },
      ]);

      if (
        files.hasAttachedFiles &&
        files.oldFile &&
        files.newFile &&
        internalUserId
      ) {
        const uploadResponse = await apiClient.compareDocuments(
          Number(activeChatId),
          internalUserId,
          files.oldFile,
          files.newFile,
        );
        const newDocId = uploadResponse?.new_document_id || uploadResponse?.id;
        files.setChatDocuments((prev) => [
          ...prev,
          {
            id: newDocId ? newDocId - 1 : Date.now(),
            filename: files.oldFile!.name,
          },
          { id: newDocId || Date.now() + 1, filename: files.newFile!.name },
        ]);
      }

      const lastRealMessage = [...chatMessages.messages]
        .reverse()
        .find((m) => typeof m.id === "number");
      const lastMessageId = lastRealMessage ? lastRealMessage.id : undefined;

      const responseData = await apiClient.sendMessage(Number(activeChatId), {
        text: userTextForUI,
        comparison_id: lastMessageId,
      });

      let finalAiText = responseData.text || "";

      if (responseData.diff_blocks && responseData.diff_blocks.length > 0) {
        finalAiText = JSON.stringify({
          analysis: { summary: responseData.text },
          diff_blocks: responseData.diff_blocks,
        });
        tgHapticNotification("warning");
      } else {
        tgHapticNotification("success");
      }

      chatMessages.setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? { ...msg, text: finalAiText, isComplete: true }
            : msg,
        ),
      );

      if (files.hasAttachedFiles) {
        files.setOldFile(null);
        files.setNewFile(null);
      }
    } catch (error) {
      tgHapticNotification("error");
      chatMessages.setMessages((prev) => [
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

  // 6. ВОЗВРАЩАЕМ ФАСАД ДЛЯ КОМПОНЕНТОВ
  return {
    ...chatMessages,
    ...files,
    ...modals,
    inputText,
    setInputText,
    isTyping,
    executeDeleteChat,
    handleExport,
    handleSend,
  };
};
