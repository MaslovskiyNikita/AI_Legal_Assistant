// src/app/pages/Chat.tsx
import React, { useEffect, useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ChevronLeft,
  MoreVertical,
  Paperclip,
  Send,
  Shield,
  Scale,
  CheckCircle2,
  X,
  Download,
  FileText,
  Trash2,
  Share2,
} from "lucide-react";
import { useNavigate, useParams, useLocation } from "react-router";
import { apiClient } from "../api/client";
import { exportToDocx, exportToPdf } from "../../utils/exportUtils";

const COLORS = {
  bg: "#000000",
  surface: "#1C1C1D",
  primary: "#d946ef", // Маджента/Пурпурный как на скринах
};

export default function Chat() {
  const navigate = useNavigate();
  const { chatId } = useParams();
  const userStr = localStorage.getItem("user");
  const internalUserId = userStr ? JSON.parse(userStr).id : null;
  const location = useLocation();

  const [currentChatId, setCurrentChatId] = useState<string | undefined>(
    chatId,
  );
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isCreatingChat = useRef(false);
  const hasHandledInitialPrompt = useRef(false);
  // --- Состояния для сравнения файлов ---
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [oldFile, setOldFile] = useState<File | null>(null);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [compareError, setCompareError] = useState("");

  // --- Состояния для меню, скачивания и УДАЛЕНИЯ ---
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [chatDocuments, setChatDocuments] = useState<any[]>([]);
  const [copiedMessageId, setCopiedMessageId] = useState<
    number | string | null
  >(null);

  const handleCopy = (text: string, id: number | string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (currentChatId && currentChatId !== "new") {
      if (isCreatingChat.current) {
        isCreatingChat.current = false;
        return;
      }

      Promise.all([
        apiClient.getChat(Number(currentChatId)),
        apiClient.getChatDocuments(Number(currentChatId)),
      ])
        .then(([chatRes, docsRes]) => {
          const historicalMessages = (chatRes.messages || []).map(
            (msg: any) => ({ ...msg, isComplete: true }),
          );
          setMessages(historicalMessages);
          setChatDocuments(docsRes || []);
        })
        .catch((err) => console.error("Failed to load chat or documents", err));
    } else if (currentChatId === "new") {
      // Очищаем историю только если мы не в процессе отправки стартового промпта!
      if (!hasHandledInitialPrompt.current) {
        setMessages([]);
        setChatDocuments([]);
      }
    }
  }, [currentChatId]);

  useEffect(() => {
    // Получаем промпт из роутера
    const prompt = location.state?.initialPrompt;

    // Если промпт есть, и мы еще его не отправляли
    if (prompt && currentChatId === "new" && !hasHandledInitialPrompt.current) {
      hasHandledInitialPrompt.current = true; // Блокируем повторную отправку

      // Тихо очищаем историю браузера, чтобы при обновлении страницы сообщение не ушло второй раз.
      // (Это не вызывает багованный ре-рендер, в отличие от navigate!)
      window.history.replaceState({}, document.title);

      // Отправляем сообщение с микро-задержкой, чтобы интерфейс успел прогрузиться
      setTimeout(() => {
        handleSend(prompt);
      }, 150);
    }
  }, [location.state?.initialPrompt, currentChatId]);

  const executeDeleteChat = async () => {
    if (!currentChatId || currentChatId === "new") return;
    try {
      await apiClient.deleteChat(Number(currentChatId));
      setIsDeleteModalOpen(false);
      navigate("/profile", { replace: true });
    } catch (error) {
      console.error("Failed to delete chat", error);
      alert("Не удалось удалить чат. Пожалуйста, попробуйте еще раз.");
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
      alert("Не удалось экспортировать чат.");
    } finally {
      setTimeout(() => {
        setIsExporting(false);
        setIsExportModalOpen(false);
      }, 500);
    }
  };

  const handleCompareFiles = async () => {
    if (!oldFile || !newFile || !internalUserId) {
      setCompareError("Please select both files.");
      return;
    }
    setIsComparing(true);
    setCompareError("");
    try {
      let targetChatId = currentChatId;
      if (!targetChatId || targetChatId === "new") {
        const newChat = await apiClient.createChat({
          user_id: internalUserId,
          title: `Сравнение: ${oldFile.name.substring(0, 10)}...`,
        });
        targetChatId = newChat.id.toString();

        // ВАЖНО: Добавлено, чтобы useEffect не стер локальные сообщения при создании чата!
        isCreatingChat.current = true;

        setCurrentChatId(targetChatId);
        navigate(`/chat/${targetChatId}`, { replace: true });
      }
      setIsCompareModalOpen(false);

      const uploadResponse = await apiClient.compareDocuments(
        Number(targetChatId),
        internalUserId,
        oldFile,
        newFile,
      );

      const comparisonId =
        uploadResponse?.new_document_id || uploadResponse?.id;

      setChatDocuments((prev) => [
        ...prev,
        { id: comparisonId - 1 || Date.now(), filename: oldFile.name },
        { id: comparisonId || Date.now() + 1, filename: newFile.name },
      ]);

      const promptText = "Пожалуйста, проанализируй и сравни эти документы.";

      // 1. Генерируем 100% уникальные ID (чтобы текст ИИ не приклеился к юзеру)
      const baseTime = Date.now();
      const userMsg1Id = `msg_${baseTime}_user1`;
      const userMsg2Id = `msg_${baseTime}_user2`;
      const assistantMsgId = `msg_${baseTime}_ai`;

      // 2. Добавляем все 3 сообщения за ОДИН вызов setMessages, чтобы избежать багов React batching
      setMessages((prev) => [
        ...prev,
        {
          id: userMsg1Id,
          role: "user",
          text: `Прикреплены документы для сравнения: 1. ${oldFile.name} 2. ${newFile.name}`,
          created_at: new Date().toISOString(),
        },
        {
          id: userMsg2Id,
          role: "user",
          text: promptText,
          created_at: new Date().toISOString(),
        },
        {
          id: assistantMsgId,
          role: "ai",
          text: "",
          created_at: new Date().toISOString(),
          isComplete: false,
        },
      ]);

      await apiClient.sendMessageStream(
        Number(targetChatId),
        { text: promptText, comparison_id: comparisonId },
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

      setOldFile(null);
      setNewFile(null);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_err_${Date.now()}`,
          role: "ai",
          text: "❌ Произошла ошибка при загрузке или анализе документов. Попробуйте еще раз.",
          created_at: new Date().toISOString(),
          isComplete: true,
        },
      ]);
    } finally {
      setIsComparing(false);
    }
  };

  const handleSend = async (textOverride?: string | React.MouseEvent) => {
    const textToSend =
      typeof textOverride === "string" ? textOverride : inputText;
    if (!textToSend.trim() || isTyping) return;
    setInputText("");

    // Генерируем уникальный ID для сообщения пользователя
    const userMsgId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_user`;

    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        role: "user",
        text: textToSend,
        created_at: new Date().toISOString(),
      },
    ]);
    setIsTyping(true);
    let activeChatId = currentChatId;
    try {
      if (activeChatId === "new" || !activeChatId) {
        if (!internalUserId) throw new Error("User ID not found");
        const newChat = await apiClient.createChat({
          user_id: internalUserId,
          title: textToSend.substring(0, 30) + "...",
        });
        activeChatId = newChat.id.toString();
        isCreatingChat.current = true;
        setCurrentChatId(activeChatId);
        navigate(`/chat/${activeChatId}`, { replace: true });
      }

      // Генерируем уникальный ID для ответа ИИ
      const assistantMsgId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_ai`;

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
      await apiClient.sendMessageStream(
        Number(activeChatId),
        { text: textToSend },
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
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => prev.filter((msg) => msg.id !== userMsgId));
    } finally {
      setIsTyping(false);
    }
  };
  const renderMessage = (msg: any) => {
    const isUser = msg.role === "user";
    const timeString = new Date(msg.created_at).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const textContent = msg.text || msg.content || "";
    const showFooter = isUser || msg.isComplete;

    return (
      <div
        key={msg.id}
        className={`flex ${isUser ? "justify-end" : "justify-start"} z-10 relative`}
      >
        <div
          className={`max-w-[90%] px-4 py-3 text-[15px] leading-relaxed text-white shadow-sm ${
            isUser
              ? "rounded-3xl rounded-tr-sm bg-[#1C1C1D] border border-white/5"
              : "rounded-3xl rounded-tl-sm bg-[#1C1C1D]/80 backdrop-blur-md border border-white/10"
          }`}
        >
          <div className="text-[15px] break-words">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                table: ({ node, ref, ...props }) => (
                  <div className="overflow-x-auto my-3 border border-white/10 rounded-xl">
                    <table className="w-full text-left text-sm" {...props} />
                  </div>
                ),
                th: ({ node, ref, ...props }) => (
                  <th
                    className="bg-white/5 p-2 font-semibold border-b border-white/10"
                    {...props}
                  />
                ),
                td: ({ node, ref, ...props }) => (
                  <td
                    className="p-2 border-b border-white/5 last:border-0"
                    {...props}
                  />
                ),
                p: ({ node, ref, ...props }) => (
                  <p className="mb-2 last:mb-0" {...props} />
                ),
                a: ({ node, ref, ...props }) => (
                  <a
                    className="text-[#d946ef] underline hover:text-[#a855f7]"
                    {...props}
                  />
                ),
              }}
            >
              {textContent}
            </ReactMarkdown>
          </div>

          {showFooter && (
            <div
              className={`flex items-center justify-end gap-3 mt-2 ${isUser ? "text-white/50" : "text-white/50"}`}
            >
              {!isUser && textContent && (
                <button
                  onClick={() => handleCopy(textContent, msg.id)}
                  className={`text-[11px] font-semibold transition-opacity cursor-pointer uppercase ${
                    copiedMessageId === msg.id
                      ? "text-green-400"
                      : "text-white/60 hover:text-[#d946ef]"
                  }`}
                >
                  {copiedMessageId === msg.id ? "Copied!" : "Copy"}
                </button>
              )}
              <div className="flex items-center gap-1 text-[11px]">
                {timeString}
                {isUser && (
                  <CheckCircle2 size={12} className="inline text-[#d946ef]" />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-[100dvh] w-full relative flex flex-col bg-black overflow-hidden font-sans">
      {/* Фоновое пурпурное свечение */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-[#d946ef]/20 to-transparent blur-[80px] pointer-events-none z-0"></div>

      {/* Header как на втором скриншоте */}
      <div className="h-16 px-4 flex items-center justify-between sticky top-0 z-20 bg-black/40 backdrop-blur-xl border-b border-white/5">
        <button
          onClick={() => navigate("/profile")}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors cursor-pointer"
        >
          <ChevronLeft size={20} />
        </button>

        <span className="text-[17px] font-medium text-white/90">
          Legal Expert
        </span>

        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors cursor-pointer"
          >
            <MoreVertical size={18} />
          </button>

          {isMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsMenuOpen(false)}
              />
              <div className="absolute right-0 top-12 w-56 bg-[#1C1C1D] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden py-1 backdrop-blur-xl">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsDownloadModalOpen(true);
                  }}
                  className="w-full text-left px-4 py-3 text-[14px] font-medium text-white hover:bg-white/5 transition-colors flex items-center gap-3 cursor-pointer"
                >
                  <Download size={18} className="text-[#d946ef]" />
                  Chat Documents
                </button>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsExportModalOpen(true);
                  }}
                  className="w-full text-left px-4 py-3 text-[14px] font-medium text-white hover:bg-white/5 transition-colors flex items-center gap-3 cursor-pointer"
                >
                  <Share2 size={18} className="text-[#d946ef]" />
                  Export Chat
                </button>
                {currentChatId && currentChatId !== "new" && (
                  <>
                    <div className="h-[1px] bg-white/5 mx-2 my-1" />
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        setIsDeleteModalOpen(true);
                      }}
                      className="w-full text-left px-4 py-3 text-[14px] font-medium text-[#FF3B30] hover:bg-white/5 transition-colors flex items-center gap-3 cursor-pointer"
                    >
                      <Trash2 size={18} />
                      Delete Chat
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 pb-32 z-10 relative">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-white/60 mt-10">
            <div className="w-20 h-20 bg-gradient-to-tr from-[#d946ef]/20 to-[#a855f7]/20 rounded-full flex items-center justify-center mb-6 border border-[#d946ef]/30">
              <Scale size={36} className="text-[#d946ef]" />
            </div>
            <p className="text-[18px] font-medium text-white mb-2">
              Готов помочь
            </p>
            <p className="text-[14px] max-w-[250px] leading-relaxed">
              Задайте юридический вопрос или прикрепите документ для анализа.
            </p>
          </div>
        ) : (
          <>
            {messages.length > 0 && (
              <p className="text-center text-[12px] font-medium text-white/40 mb-2 mt-1">
                Chat History
              </p>
            )}
            {messages.map((msg: any, index: number) => (
              <React.Fragment
                key={`${msg.id ?? msg.created_at ?? "msg"}-${index}`}
              >
                {renderMessage(msg)}
              </React.Fragment>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Модалки (Стилизованы под новую тему) */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-md">
          <div className="bg-[#1C1C1D] rounded-3xl p-6 w-full max-w-xs border border-white/10 shadow-2xl flex flex-col items-center text-center animate-in fade-in zoom-in duration-200">
            <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
              <Trash2 size={28} className="text-[#FF3B30]" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Удалить чат
            </h2>
            <p className="text-[14px] text-white/60 mb-6">
              Это действие нельзя будет отменить.
            </p>
            <div className="flex w-full gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-3 rounded-xl font-medium bg-white/5 text-white hover:bg-white/10 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={executeDeleteChat}
                className="flex-1 py-3 rounded-xl font-medium bg-[#FF3B30] text-white hover:bg-red-600 transition-colors"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}

      {isDownloadModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-md">
          <div className="bg-[#1C1C1D] rounded-3xl p-6 w-full max-w-sm border border-white/10 shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center mb-4 shrink-0">
              <h2 className="text-lg font-semibold text-white">
                Chat Documents
              </h2>
              <button
                onClick={() => setIsDownloadModalOpen(false)}
                className="text-white/50 hover:text-white transition-colors p-1"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {chatDocuments.length === 0 ? (
                <div className="text-center py-8 text-white/40 text-sm bg-black/30 rounded-2xl border border-white/5">
                  No documents found
                </div>
              ) : (
                chatDocuments.map((doc, idx) => (
                  <div
                    key={doc.id || idx}
                    className="flex items-center justify-between bg-black/30 p-3 rounded-2xl border border-white/5 hover:border-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3 overflow-hidden pr-3">
                      <div className="p-2 bg-[#d946ef]/10 rounded-xl shrink-0">
                        <FileText size={20} className="text-[#d946ef]" />
                      </div>
                      <span className="text-[14px] font-medium text-white truncate">
                        {doc.filename || doc.name || `Document #${doc.id}`}
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        apiClient.downloadDocument(
                          doc.id,
                          doc.filename || "document",
                        )
                      }
                      className="p-2 text-white/50 hover:text-[#d946ef] bg-white/5 rounded-xl transition-colors shrink-0"
                    >
                      <Download size={18} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {isExportModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-md">
          <div className="bg-[#1C1C1D] rounded-3xl p-6 w-full max-w-xs border border-white/10 shadow-2xl flex flex-col items-center text-center animate-in fade-in zoom-in duration-200">
            <div className="w-14 h-14 bg-[#d946ef]/10 rounded-full flex items-center justify-center mb-4">
              <Share2 size={28} className="text-[#d946ef]" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Экспорт чата
            </h2>
            <p className="text-[14px] text-white/60 mb-6">
              Сохранить историю переписки.
            </p>
            <div className="flex flex-col w-full gap-3">
              <button
                onClick={() => handleExport("docx")}
                disabled={isExporting}
                className="w-full py-3 rounded-xl font-medium bg-white/5 text-white hover:bg-white/10 transition-colors"
              >
                {isExporting ? "Экспорт..." : "Скачать в .DOCX"}
              </button>
              <button
                onClick={() => handleExport("pdf")}
                disabled={isExporting}
                className="w-full py-3 rounded-xl font-medium bg-white/5 text-white hover:bg-white/10 transition-colors"
              >
                {isExporting ? "Экспорт..." : "Скачать в .PDF"}
              </button>
              <button
                onClick={() => setIsExportModalOpen(false)}
                disabled={isExporting}
                className="w-full mt-2 text-sm text-white/50 hover:text-white transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {isCompareModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-md">
          <div className="bg-[#1C1C1D] rounded-3xl p-6 w-full max-w-sm border border-white/10 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-white">
                Сравнение документов
              </h2>
              <button
                onClick={() => setIsCompareModalOpen(false)}
                className="text-white/50 hover:text-white p-1"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-white/70 block mb-2">
                  Старая версия
                </label>
                <input
                  type="file"
                  onChange={(e) => setOldFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-white/70 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-white/70 block mb-2">
                  Новая версия
                </label>
                <input
                  type="file"
                  onChange={(e) => setNewFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-white/70 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer"
                />
              </div>
            </div>
            {compareError && (
              <p className="text-sm text-red-500 mt-4">{compareError}</p>
            )}
            <button
              onClick={handleCompareFiles}
              disabled={!oldFile || !newFile || isComparing}
              className="w-full bg-[#d946ef] text-white font-medium py-3 rounded-xl mt-6 disabled:opacity-50 hover:bg-[#a855f7] transition-colors"
            >
              {isComparing ? "Анализ..." : "Сравнить файлы"}
            </button>
          </div>
        </div>
      )}

      <div className="absolute bottom-0 left-0 w-full flex flex-col pt-4 pb-6 px-4 backdrop-blur-xl bg-black/60 border-t border-white/5 z-40">
        <div className="flex overflow-x-auto gap-2 pb-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {["Анализ Договора", "Риски", "Сводка"].map((text) => (
            <button
              key={text}
              onClick={() => handleSend(text)}
              disabled={isTyping}
              className="whitespace-nowrap px-4 py-1.5 rounded-full text-[13px] font-medium text-white/80 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {text}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCompareModalOpen(true)}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/70 hover:text-white transition-colors shrink-0 cursor-pointer"
          >
            <Paperclip size={20} className="rotate-45" />
          </button>

          <div className="flex-1 bg-[#1C1C1D] border border-white/10 rounded-full flex items-center pl-5 pr-1 py-1 h-12">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend();
              }}
              placeholder="Ask anything..."
              className="flex-1 bg-transparent border-none outline-none text-white text-[15px] placeholder:text-white/40"
            />
            <button
              onClick={handleSend}
              disabled={isTyping || !inputText.trim()}
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-[#d946ef] transition-transform active:scale-95 disabled:opacity-50 cursor-pointer ml-2"
            >
              <Send size={18} className="text-white ml-0.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
