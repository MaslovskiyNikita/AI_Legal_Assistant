// src/features/chat/hooks/useChat.ts
import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router";
import { apiClient } from "../../../api/client";
import { exportToDocx, exportToPdf } from "../../../utils/exportUtils";
import { getTg, tgAlert, tgHapticNotification } from "../../../utils/telegram";

import { useChatModals } from "./useChatModals";
import { useChatFiles } from "./useChatFiles";
import { useChatMessages } from "./useChatMessages";

export const useChat = (initialChatId: string | undefined) => {
  const navigate = useNavigate();
  const location = useLocation();
  const userStr = localStorage.getItem("user");
  const internalUserId = userStr ? JSON.parse(userStr).id : null;

  // 👇 РЕШЕНИЕ: Храним ID локально, чтобы менять его без перезагрузки страницы
  const [currentChatId, setCurrentChatId] = useState(initialChatId);
  const hasFetchedHistory = useRef(false);

  const modals = useChatModals();
  const files = useChatFiles();
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const chatMessages = useChatMessages(
    currentChatId,
    isTyping,
    files.hasAttachedFiles,
  );
  const hasHandledInitialPrompt = useRef(false);

  // Синхронизация локального ID с URL при реальных переходах (кнопка Назад и т.д.)
  useEffect(() => {
    setCurrentChatId(initialChatId);
    if (initialChatId === "new") {
      hasFetchedHistory.current = false;
    }
  }, [initialChatId]);

  // Нативная кнопка "Назад"
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

  // 1. ОЧИСТКА СОСТОЯНИЯ ПРИ НОВОМ ЧАТЕ
  useEffect(() => {
    if (currentChatId === "new") {
      chatMessages.setMessages([]);
      files.setChatDocuments([]);
      files.setOldFile(null);
      files.setNewFile(null);
      setInputText("");
      hasHandledInitialPrompt.current = false;
    }
  }, [currentChatId]);

  // 2. ЗАГРУЗКА ИСТОРИИ СУЩЕСТВУЮЩЕГО ЧАТА (Ровно 1 раз!)
  useEffect(() => {
    if (!currentChatId || currentChatId === "new") return;
    if (hasFetchedHistory.current) return; // Блокируем перезапрос истории
    if (isTyping) return; // Ждем, пока ИИ допечатает

    hasFetchedHistory.current = true;

    Promise.all([
      apiClient.getChat(Number(currentChatId)),
      apiClient.getChatDocuments(Number(currentChatId)),
    ])
      .then(([chatRes, docsRes]) => {
        const historicalMessages = (chatRes.messages || []).map((msg: any) => ({
          ...msg,
          isComplete: true,
        }));
        chatMessages.setMessages(historicalMessages);
        files.setChatDocuments(docsRes || []);
      })
      .catch((err) => console.error("Failed to load chat", err));
  }, [currentChatId, isTyping]);

  // Обработка стартового промпта (когда жмем "Начать" из профиля)
  useEffect(() => {
    const prompt = location.state?.initialPrompt;
    if (prompt && currentChatId === "new" && !hasHandledInitialPrompt.current) {
      hasHandledInitialPrompt.current = true;
      const newState = { ...location.state };
      delete newState.initialPrompt;
      navigate(location.pathname, { replace: true, state: newState });
      setTimeout(() => handleSend(prompt), 150);
    }
  }, [location.state, currentChatId, navigate, location.pathname]);

  // Удаление и Экспорт
  const executeDeleteChat = async () => {
    if (!currentChatId || currentChatId === "new") return;
    try {
      await apiClient.deleteChat(Number(currentChatId));
      modals.setIsDeleteModalOpen(false);
      navigate("/profile", { replace: true });
    } catch (error) {
      tgAlert("Не удалось удалить чат. Попробуйте еще раз.");
    }
  };

  const handleExport = async (format: "docx" | "pdf") => {
    files.setIsExporting(true);
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
        files.setIsExporting(false);
        modals.setIsExportModalOpen(false);
      }, 500);
    }
  };

  // 3. ГЛАВНАЯ БИЗНЕС-ЛОГИКА (ОТПРАВКА)
  const handleSend = async (textOverride?: string | React.MouseEvent) => {
    const textToSend =
      typeof textOverride === "string" ? textOverride : inputText;
    if (!textToSend.trim() && !files.hasAttachedFiles) return;
    if (isTyping) return;

    setInputText("");
    setIsTyping(true);
    const finalPrompt = textToSend.trim();
    let activeChatId = currentChatId;

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
        hasFetchedHistory.current = true; // ЗАЩИТА: Больше не запрашиваем историю!
        setCurrentChatId(activeChatId);

        // 👇 ТИХАЯ СМЕНА URL (Без ререндера страницы!)
        window.history.replaceState(null, "", `/chat/${activeChatId}`);
      }

      const userMsgId = `msg_${Date.now()}_user`;
      let userTextForUI = finalPrompt;

      if (files.hasAttachedFiles && files.oldFile && files.newFile) {
        userTextForUI = `Прикреплены документы для сравнения:\n1. ${files.oldFile.name}\n2. ${files.newFile.name}`;
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

  return {
    ...chatMessages,
    ...files,
    ...modals,
    chatId: currentChatId, // Экспортируем правильный стабильный ID
    inputText,
    setInputText,
    isTyping,
    executeDeleteChat,
    handleExport,
    handleSend,
  };
};
