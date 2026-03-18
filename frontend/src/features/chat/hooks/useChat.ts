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

  const [currentChatId, setCurrentChatId] = useState(initialChatId);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // 👇 ЖЕСТКИЕ БЛОКИРОВКИ (Мутексы)
  const isSendingRef = useRef(false); // Защита от двойного клика
  const localSessionLock = useRef(false); // Защита от фоновой загрузки истории
  const hasFetchedHistory = useRef(false);
  const hasHandledInitialPrompt = useRef(false);

  const modals = useChatModals();
  const files = useChatFiles();
  const chatMessages = useChatMessages(
    currentChatId,
    isTyping,
    files.hasAttachedFiles,
  );

  // Синхронизация ID с URL (когда роутер нас реально перенаправляет)
  useEffect(() => {
    if (initialChatId !== currentChatId) {
      setCurrentChatId(initialChatId);
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

  // 1. ОЧИСТКА СОСТОЯНИЯ (Только когда реально заходим в /chat/new)
  useEffect(() => {
    if (initialChatId === "new") {
      chatMessages.setMessages([]);
      files.setChatDocuments([]);
      files.setOldFile(null);
      files.setNewFile(null);
      setInputText("");
      hasHandledInitialPrompt.current = false;
      localSessionLock.current = false;
      hasFetchedHistory.current = false;
    }
  }, [initialChatId]); // <-- Строго следим за initialChatId от роутера

  // 2. ЗАГРУЗКА ИСТОРИИ (СТРОГО ОДИН РАЗ И ТОЛЬКО ДЛЯ СТАРЫХ ЧАТОВ)
  useEffect(() => {
    if (!currentChatId || currentChatId === "new") return;
    if (hasFetchedHistory.current) return;
    if (localSessionLock.current) return; // Если чат создан только что - не тянем с сервера!

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
  }, [currentChatId]);

  // 3. ОБРАБОТКА СТАРТОВОГО ПРОМПТА (ИЗ ПРОФИЛЯ)
  useEffect(() => {
    const prompt = location.state?.initialPrompt;
    if (prompt && initialChatId === "new" && !hasHandledInitialPrompt.current) {
      hasHandledInitialPrompt.current = true;
      // Очищаем стейт роутера, чтобы при ререндере не отправить промпт второй раз
      navigate(location.pathname, { replace: true, state: {} });
      setTimeout(() => handleSend(prompt), 100);
    }
  }, [location.state, initialChatId, navigate]);

  useEffect(() => {
    if (location.state?.openCompareModal) {
      modals.setIsCompareModalOpen(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  // Экспорт и Удаление
  const executeDeleteChat = async () => {
    if (!currentChatId || currentChatId === "new") return;
    try {
      await apiClient.deleteChat(Number(currentChatId));
      modals.setIsDeleteModalOpen(false);
      navigate("/profile", { replace: true });
    } catch (error) {
      tgAlert("Не удалось удалить чат.");
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

  // 4. ГЛАВНАЯ БИЗНЕС-ЛОГИКА (ОТПРАВКА С ЗАЩИТОЙ ОТ ДУБЛЕЙ)
  const handleSend = async (textOverride?: string | React.MouseEvent) => {
    // ЗАЩИТА: Если уже отправляем - игнорируем клик
    if (isSendingRef.current || isTyping) return;

    const textToSend =
      typeof textOverride === "string" ? textOverride : inputText;

    // Фиксируем текущие файлы, чтобы они не потерялись при рендере
    const currentOldFile = files.oldFile;
    const currentNewFile = files.newFile;
    const hasFiles = Boolean(currentOldFile && currentNewFile);

    if (!textToSend.trim() && !hasFiles) return;

    // Включаем блокировку
    isSendingRef.current = true;
    setIsTyping(true);

    // 👇 ОЧИЩАЕМ UI МОМЕНТАЛЬНО, чтобы не было дублей на экране
    setInputText("");
    if (hasFiles) {
      files.setOldFile(null);
      files.setNewFile(null);
    }

    const finalPrompt = textToSend.trim();
    let activeChatId = currentChatId;

    try {
      // СОЗДАНИЕ ЧАТА
      if (activeChatId === "new" || !activeChatId) {
        if (!internalUserId) throw new Error("User ID not found");

        // ЗАЩИТА: Запрещаем хуку скачивать историю, так как мы сами всё построим
        localSessionLock.current = true;

        const chatTitle = hasFiles
          ? `Сравнение: ${currentOldFile!.name.substring(0, 10)}...`
          : finalPrompt.substring(0, 30) + "...";

        const newChat = await apiClient.createChat({
          user_id: internalUserId,
          title: chatTitle,
        });
        activeChatId = newChat.id.toString();

        setCurrentChatId(activeChatId);
        // Сообщаем React Router'у, что URL изменился (без моргания благодаря настройкам App.tsx)
        navigate(`/chat/${activeChatId}`, { replace: true });
      }

      // СООБЩЕНИЕ ПОЛЬЗОВАТЕЛЯ
      const userMsgId = `msg_${Date.now()}_user`;
      let userTextForUI = finalPrompt;

      if (hasFiles) {
        userTextForUI = `Прикреплены документы для сравнения:\n1. ${currentOldFile!.name}\n2. ${currentNewFile!.name}`;
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

      // ЛОАДЕР ИИ
      const assistantMsgId = `msg_${Date.now()}_ai`;
      const loadingTextPlaceholder = hasFiles ? "{" : "...";

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

      // ЗАГРУЗКА ФАЙЛОВ НА СЕРВЕР
      if (hasFiles && internalUserId) {
        const uploadResponse = await apiClient.compareDocuments(
          Number(activeChatId),
          internalUserId,
          currentOldFile!,
          currentNewFile!,
        );
        const newDocId = uploadResponse?.new_document_id || uploadResponse?.id;
        files.setChatDocuments((prev) => [
          ...prev,
          {
            id: newDocId ? newDocId - 1 : Date.now(),
            filename: currentOldFile!.name,
          },
          { id: newDocId || Date.now() + 1, filename: currentNewFile!.name },
        ]);
      }

      // ЗАПРОС К ИИ
      const lastRealMessage = [...chatMessages.messages]
        .reverse()
        .find((m) => typeof m.id === "number");
      const lastMessageId = lastRealMessage ? lastRealMessage.id : undefined;

      const responseData = await apiClient.sendMessage(Number(activeChatId), {
        text: userTextForUI,
        comparison_id: lastMessageId,
      });

      // ПАРСИНГ ОТВЕТА
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

      // ЗАМЕНЯЕМ ЛОАДЕР НА ТЕКСТ
      chatMessages.setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? { ...msg, text: finalAiText, isComplete: true }
            : msg,
        ),
      );
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
      // Снимаем блокировки
      isSendingRef.current = false;
      setIsTyping(false);
    }
  };

  return {
    ...chatMessages,
    ...files,
    ...modals,
    chatId: currentChatId,
    inputText,
    setInputText,
    isTyping,
    executeDeleteChat,
    handleExport,
    handleSend,
  };
};
