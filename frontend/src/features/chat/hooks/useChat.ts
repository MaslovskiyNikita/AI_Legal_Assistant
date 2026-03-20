import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router";
import { apiClient } from "../../../api/client";
import { getTg, tgAlert, tgHapticNotification } from "../../../utils/telegram";
import { useToast } from "../../../hooks/useToast";

import { useChatModals } from "./useChatModals";
import { useChatFiles } from "./useChatFiles";
import { useChatMessages } from "./useChatMessages";

export const useChat = (initialChatId: string | undefined) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const userStr = localStorage.getItem("user");
  const internalUserId = userStr ? JSON.parse(userStr).id : null;

  const [currentChatId, setCurrentChatId] = useState(initialChatId);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const isSendingRef = useRef(false);
  const localSessionLock = useRef(false);
  const hasFetchedHistory = useRef(false);
  const hasHandledInitialPrompt = useRef(false);

  const chatToneRef = useRef<string>("friendly");

  if (location.state?.tone) {
    chatToneRef.current = location.state.tone;
  }

  const backPath = location.state?.from || "/profile";

  const modals = useChatModals();
  const files = useChatFiles();
  const chatMessages = useChatMessages(
    currentChatId,
    isTyping,
    files.hasAttachedFiles,
  );

  useEffect(() => {
    if (initialChatId !== currentChatId) {
      setCurrentChatId(initialChatId);
    }
  }, [initialChatId]);

  useEffect(() => {
    const tg = getTg();
    if (tg && tg.BackButton) {
      tg.BackButton.show();
      const handleBack = () => navigate(backPath);
      tg.BackButton.onClick(handleBack);
      return () => {
        tg.BackButton.offClick(handleBack);
        tg.BackButton.hide();
      };
    }
  }, [navigate, backPath]);

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
  }, [initialChatId]);

  useEffect(() => {
    if (!currentChatId || currentChatId === "new") return;
    if (hasFetchedHistory.current) return;
    if (localSessionLock.current) return;

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

  useEffect(() => {
    const prompt = location.state?.initialPrompt;
    if (prompt && initialChatId === "new" && !hasHandledInitialPrompt.current) {
      hasHandledInitialPrompt.current = true;
      navigate(location.pathname, {
        replace: true,
        state: { ...location.state, tone: chatToneRef.current },
      });
      setTimeout(() => handleSend(prompt), 100);
    }
  }, [location.state, initialChatId, navigate]);

  useEffect(() => {
    if (location.state?.openCompareModal) {
      modals.setIsCompareModalOpen(true);
      navigate(location.pathname, {
        replace: true,
        state: { ...location.state, tone: chatToneRef.current },
      });
    }
  }, [location.state, navigate]);

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
    if (!currentChatId || currentChatId === "new") {
      tgAlert("Для экспорта необходимо сначала начать диалог.");
      return;
    }

    files.setIsExporting(true);
    try {
      const dateStr = new Date().toISOString().split("T")[0];
      const filename = `Отчет_Legal_Expert_${dateStr}.${format}`;

      await apiClient.exportChat(Number(currentChatId), format, filename);

      tgHapticNotification("success");
    } catch (error) {
      console.error("Export error", error);
      tgAlert("Не удалось экспортировать чат.");
    } finally {
      setTimeout(() => {
        files.setIsExporting(false);
        modals.setIsExportModalOpen(false);
      }, 500);
    }
  };

  const handlePostAnalysis = async () => {
    if (!currentChatId || currentChatId === "new") {
      showToast("Сначала начните диалог или загрузите документы.", "info");
      return;
    }
    if (isSendingRef.current || isTyping) return;

    isSendingRef.current = true;
    setIsTyping(true);
    tgHapticNotification("success");

    const postAnalysisMsgId = `msg_${Date.now()}_post`;

    chatMessages.setMessages((prev) => [
      ...prev,
      {
        id: postAnalysisMsgId,
        role: "ai",
        text: "...",
        created_at: new Date().toISOString(),
        isComplete: false,
      },
    ]);

    try {
      const postResponse = await apiClient.createPostAnalysis(
        Number(currentChatId),
      );

      chatMessages.setMessages((prev) =>
        prev.map((msg) =>
          msg.id === postAnalysisMsgId
            ? { ...msg, text: postResponse.text, isComplete: true }
            : msg,
        ),
      );

      if (internalUserId) {
        apiClient
          .getUser(internalUserId)
          .then((freshProfile) => {
            const oldUser = JSON.parse(localStorage.getItem("user") || "{}");
            localStorage.setItem(
              "user",
              JSON.stringify({ ...oldUser, ...freshProfile }),
            );
          })
          .catch((e) => console.error(e));
      }
    } catch (error: any) {
      console.error("Ошибка при генерации постанализа:", error);
      chatMessages.setMessages((prev) =>
        prev.filter((m) => m.id !== postAnalysisMsgId),
      );

      if (
        error.status === 403 ||
        (error.message && error.message.includes("токенов"))
      ) {
        showToast("Недостаточно токенов для этого действия", "error");
        navigate("/profile", {
          replace: true,
          state: { openTokenModal: true },
        });
      } else {
        chatMessages.setMessages((prev) => [
          ...prev,
          {
            id: `msg_err_${Date.now()}`,
            role: "ai",
            text: `❌ ${error.message || "Не удалось сформировать отчет."}`,
            created_at: new Date().toISOString(),
            isComplete: true,
          },
        ]);
      }
    } finally {
      isSendingRef.current = false;
      setIsTyping(false);
    }
  };

  const handleSend = async (textOverride?: string | React.MouseEvent) => {
    if (isSendingRef.current || isTyping) return;

    const textToSend =
      typeof textOverride === "string" ? textOverride : inputText;

    const currentOldFile = files.oldFile;
    const currentNewFile = files.newFile;
    const hasFiles = Boolean(currentOldFile && currentNewFile);

    if (!textToSend.trim() && !hasFiles) return;

    isSendingRef.current = true;
    setIsTyping(true);

    setInputText("");
    if (hasFiles) {
      files.setOldFile(null);
      files.setNewFile(null);
    }

    const finalPrompt = textToSend.trim();
    let activeChatId = currentChatId;

    const assistantMsgId = `msg_${Date.now()}_ai`;
    const userMsgId = `msg_${Date.now()}_user`;

    try {
      if (activeChatId === "new" || !activeChatId) {
        if (!internalUserId) throw new Error("User ID not found");

        localSessionLock.current = true;

        const chatTitle = hasFiles
          ? `Сравнение: ${currentOldFile!.name.substring(0, 10)}...`
          : finalPrompt.substring(0, 30) + "...";

        const newChat = await apiClient.createChat({
          user_id: internalUserId,
          title: chatTitle,
          tone: chatToneRef.current,
        });
        activeChatId = newChat.id.toString();

        setCurrentChatId(activeChatId);
        navigate(`/chat/${activeChatId}`, {
          replace: true,
          state: { ...location.state, tone: chatToneRef.current },
        });
      }

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

      let comparisonMsgId: number | undefined = undefined;

      if (hasFiles && internalUserId) {
        const uploadResponse = await apiClient.compareDocuments(
          Number(activeChatId),
          internalUserId,
          currentOldFile!,
          currentNewFile!,
          userTextForUI,
        );

        comparisonMsgId = uploadResponse?.message_id;

        const newDocId = uploadResponse?.new_document_id || uploadResponse?.id;

        files.setChatDocuments((prev) => {
          const newDocs = [...prev];
          const oldExists = newDocs.some(
            (d) => d.filename === currentOldFile!.name,
          );
          const newExists = newDocs.some(
            (d) => d.filename === currentNewFile!.name,
          );

          if (!oldExists) {
            newDocs.push({
              id: newDocId ? newDocId - 1 : Date.now(),
              filename: currentOldFile!.name,
            });
          }
          if (!newExists) {
            newDocs.push({
              id: newDocId || Date.now() + 1,
              filename: currentNewFile!.name,
            });
          }
          return newDocs;
        });
      }

      const targetComparisonId = comparisonMsgId ? comparisonMsgId : undefined;

      const responseData = await apiClient.sendMessage(Number(activeChatId), {
        text: userTextForUI,
        comparison_id: targetComparisonId,
      });

      let finalAiText = responseData.text || "";
      const newAiData =
        responseData.diff_blocks && responseData.diff_blocks.length > 0
          ? { diff_blocks: responseData.diff_blocks }
          : null;

      if (newAiData) {
        tgHapticNotification("warning");
      } else {
        tgHapticNotification("success");
      }

      chatMessages.setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                text: finalAiText,
                ai_data: newAiData,
                isComplete: true,
              }
            : msg,
        ),
      );

      if (internalUserId) {
        apiClient
          .getUser(internalUserId)
          .then((freshProfile) => {
            const oldUser = JSON.parse(localStorage.getItem("user") || "{}");
            localStorage.setItem(
              "user",
              JSON.stringify({ ...oldUser, ...freshProfile }),
            );
          })
          .catch((e) =>
            console.error("Ошибка фонового обновления профиля:", e),
          );
      }
    } catch (error: any) {
      tgHapticNotification("error");

      chatMessages.setMessages((prev) =>
        prev.filter((m) => m.id !== assistantMsgId && m.id !== userMsgId),
      );

      if (hasFiles) {
        files.setChatDocuments((prev) =>
          prev.filter(
            (doc) =>
              doc.filename !== currentOldFile?.name &&
              doc.filename !== currentNewFile?.name,
          ),
        );
      }

      if (
        error.status === 403 ||
        (error.message && error.message.includes("токенов"))
      ) {
        showToast("Недостаточно токенов для этого действия", "error");

        navigate("/profile", {
          replace: true,
          state: { openTokenModal: true },
        });
        return;
      }

      chatMessages.setMessages((prev) => [
        ...prev,
        {
          id: `msg_err_${Date.now()}`,
          role: "ai",
          text: `❌ ${error.message || "Произошла ошибка при обработке запроса."}`,
          created_at: new Date().toISOString(),
          isComplete: true,
        },
      ]);
    } finally {
      isSendingRef.current = false;
      setIsTyping(false);
    }
  };

  const handleExportAnalysis = async (format: "docx" | "pdf") => {
    if (!currentChatId || currentChatId === "new") return;
    try {
      const dateStr = new Date().toISOString().split("T")[0];
      const filename = `Анализ_документа_${dateStr}.${format}`;

      await apiClient.exportAnalysis(Number(currentChatId), format, filename);
      tgHapticNotification("success");
    } catch (error) {
      console.error("Export analysis error", error);
      tgAlert("Не удалось экспортировать отчет.");
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
    handleExportAnalysis,
    handleSend,
    handlePostAnalysis,
    backPath,
  };
};
