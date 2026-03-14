// src/app/pages/Chat.tsx
import React, { useEffect, useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
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
} from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { apiClient } from "../api/client";

const COLORS = {
  bg: "#1C1C1D",
  surface: "#2C2C2E",
  primary: "#3390EC",
};

export default function Chat() {
  const navigate = useNavigate();
  const { chatId } = useParams();
  const userStr = localStorage.getItem("user");
  const internalUserId = userStr ? JSON.parse(userStr).id : null;

  const [currentChatId, setCurrentChatId] = useState<string | undefined>(
    chatId,
  );
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isCreatingChat = useRef(false);

  // --- Состояния для сравнения файлов ---
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [oldFile, setOldFile] = useState<File | null>(null);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [compareError, setCompareError] = useState("");

  // --- Состояния для меню и скачивания ---
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [chatDocuments, setChatDocuments] = useState<any[]>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Загрузка истории чата и его документов
  useEffect(() => {
    if (currentChatId && currentChatId !== "new") {
      const pending = sessionStorage.getItem(
        `pending_messages_${currentChatId}`,
      );
      if (pending) {
        setMessages(JSON.parse(pending));
        sessionStorage.removeItem(`pending_messages_${currentChatId}`);
        return;
      }

      if (isCreatingChat.current) {
        isCreatingChat.current = false;
        return;
      }

      apiClient
        .getChat(Number(currentChatId))
        .then((res) => {
          setMessages(res.messages || []);
          // Если бэкенд отдает список документов, сохраняем его
          if (res.documents) {
            setChatDocuments(res.documents);
          }
        })
        .catch((err) => console.error("Failed to load chat", err));
    } else {
      setMessages([]);
      setChatDocuments([]);
    }
  }, [currentChatId]);

  useEffect(() => {
    setCurrentChatId(chatId);
  }, [chatId]);

  // --- Логика загрузки и сравнения файлов ---
  const handleCompareFiles = async () => {
    if (!oldFile || !newFile || !internalUserId) {
      setCompareError("Please select both files.");
      return;
    }

    setIsComparing(true);
    setCompareError("");

    try {
      let targetChatId = currentChatId;

      // 1. Создаем чат, если его еще нет
      if (!targetChatId || targetChatId === "new") {
        const newChat = await apiClient.createChat({
          user_id: internalUserId,
          title: `Сравнение: ${oldFile.name.substring(0, 10)}...`,
        });
        targetChatId = newChat.id.toString();

        setCurrentChatId(targetChatId);
        navigate(`/chat/${targetChatId}`, { replace: true });
      }

      setIsCompareModalOpen(false);

      // 2. Отправляем файлы на сервер.
      // В этот момент бэкенд сохранит автосообщение "Прикреплены документы..." в базу
      const uploadResponse = await apiClient.compareDocuments(
        Number(targetChatId),
        internalUserId,
        oldFile,
        newFile,
      );

      const comparisonId =
        uploadResponse?.new_document_id || uploadResponse?.id;

      // Визуально добавляем новые документы в список для скачивания
      setChatDocuments((prev) => [
        ...prev,
        { id: comparisonId - 1 || Date.now(), filename: oldFile.name },
        { id: comparisonId || Date.now() + 1, filename: newFile.name },
      ]);

      // 3. Визуально дублируем то, что сохранил бэкенд, чтобы не перезагружать страницу
      const backendAutoMsg = `Прикреплены документы для сравнения: 1. ${oldFile.name} 2. ${newFile.name}`;
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          role: "user",
          text: backendAutoMsg,
          created_at: new Date().toISOString(),
        },
      ]);

      // 4. Формируем логичный текстовый запрос, который уйдет в /stream
      const promptText = "Пожалуйста, проанализируй и сравни эти документы.";
      const promptMsgId = Date.now() + 1;
      setMessages((prev) => [
        ...prev,
        {
          id: promptMsgId,
          role: "user",
          text: promptText,
          created_at: new Date().toISOString(),
        },
      ]);

      // 5. Подготавливаем пустое сообщение от ИИ
      const assistantMsgId = Date.now() + 2;
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMsgId,
          role: "ai",
          text: "",
          created_at: new Date().toISOString(),
        },
      ]);

      // 6. Запускаем генерацию.
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

      // Очищаем форму
      setOldFile(null);
      setNewFile(null);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          role: "ai",
          text: "❌ Произошла ошибка при загрузке или анализе документов. Попробуйте еще раз.",
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsComparing(false);
    }
  };

  // --- Логика отправки обычного текста ---
  const handleSend = async (textOverride?: string | React.MouseEvent) => {
    const textToSend =
      typeof textOverride === "string" ? textOverride : inputText;
    if (!textToSend.trim() || isTyping) return;
    setInputText("");

    const tempUserId = Date.now();
    const userMsg = {
      id: tempUserId,
      role: "user",
      text: textToSend,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
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

      const assistantMsgId = Date.now() + 1;
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMsgId,
          role: "ai",
          text: "",
          created_at: new Date().toISOString(),
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
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => prev.filter((msg) => msg.id !== tempUserId));
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

    return (
      <div
        key={msg.id}
        className={`flex ${isUser ? "justify-end" : "justify-start"}`}
      >
        <div
          className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-[15px] leading-snug text-white shadow-sm ${
            isUser ? "rounded-tr-sm" : "rounded-tl-sm"
          }`}
          style={{
            backgroundColor: isUser ? COLORS.primary : COLORS.surface,
            // Добавим стили для ссылок и списков внутри markdown
            wordBreak: "break-word",
          }}
        >
          {/* Рендерим Markdown */}
          <div className="markdown-body">
            <ReactMarkdown
              components={{
                ul: (props: any) => (
                  <ul className="list-disc ml-4 my-1" {...props} />
                ),
                ol: (props: any) => (
                  <ol className="list-decimal ml-4 my-1" {...props} />
                ),
                li: (props: any) => <li className="mb-1" {...props} />,
                p: (props: any) => <p className="mb-2 last:mb-0" {...props} />,
                strong: (props: any) => (
                  <strong className="font-bold text-white" {...props} />
                ),
                h1: (props: any) => (
                  <h1 className="text-lg font-bold my-2" {...props} />
                ),
                h2: (props: any) => (
                  <h2 className="text-md font-bold my-2" {...props} />
                ),
                code: (props: any) => (
                  <code
                    className="bg-black/30 rounded px-1 font-mono text-xs"
                    {...props}
                  />
                ),
              }}
            >
              {msg.text || msg.content}
            </ReactMarkdown>
          </div>

          <div
            className={`text-[11px] text-right mt-1 -mb-1 flex items-center gap-1 ${
              isUser
                ? "justify-end text-white/70"
                : "justify-end text-[#8E8E93]"
            }`}
          >
            {timeString}
            {isUser && <CheckCircle2 size={12} className="inline" />}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full relative flex flex-col bg-[#1C1C1D]">
      {/* --- HEADER И МЕНЮ --- */}
      <div
        className="h-14 px-3 flex items-center justify-between border-b border-black/20 sticky top-0 z-10"
        style={{ backgroundColor: COLORS.surface }}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/profile")}
            className="text-white p-1 -ml-1 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          >
            <ChevronLeft size={28} />
          </button>
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center relative overflow-hidden"
              style={{ backgroundColor: COLORS.primary }}
            >
              <Shield
                size={20}
                color="#fff"
                fill="currentColor"
                opacity={0.3}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Scale size={20} color="#fff" strokeWidth={2} />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-[16px] font-semibold text-white leading-tight">
                Legal Expert AI
              </span>
              <span className="text-[13px] text-[#3390EC] font-medium leading-tight tracking-wide uppercase mt-[1px]">
                bot
              </span>
            </div>
          </div>
        </div>

        {/* --- Кнопка "Три точки" и выпадающее меню --- */}
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-white p-1 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          >
            <MoreVertical size={24} />
          </button>

          {isMenuOpen && (
            <>
              {/* Невидимый фон для закрытия меню при клике мимо */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsMenuOpen(false)}
              />
              <div className="absolute right-0 top-12 w-56 bg-[#2C2C2E] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden py-1">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsDownloadModalOpen(true);
                  }}
                  className="w-full text-left px-4 py-3 text-[15px] font-medium text-white hover:bg-white/5 transition-colors flex items-center gap-3 cursor-pointer"
                >
                  <Download size={18} className="text-[#3390EC]" />
                  Chat Documents
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* --- ОБЛАСТЬ СООБЩЕНИЙ --- */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 pb-32">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-[#8E8E93] mt-10">
            <div className="w-16 h-16 bg-[#2C2C2E] rounded-full flex items-center justify-center mb-4">
              <Shield size={32} color="#3390EC" />
            </div>
            <p className="text-[16px] font-medium text-white mb-2">
              Start a New Consultation
            </p>
            <p className="text-[14px] max-w-[250px]">
              Ask me any legal question or attach a document for analysis.
            </p>
          </div>
        ) : (
          <>
            {messages.length > 0 && (
              <p className="text-center text-[12px] font-medium text-[#8E8E93] mb-2 mt-1">
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

      {/* --- МОДАЛЬНОЕ ОКНО ДЛЯ СКАЧИВАНИЯ ФАЙЛОВ --- */}
      {isDownloadModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-[#2C2C2E] rounded-2xl p-6 w-full max-w-sm border border-white/10 shadow-lg flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center mb-4 shrink-0">
              <h2 className="text-lg font-semibold text-white">
                Chat Documents
              </h2>
              <button
                onClick={() => setIsDownloadModalOpen(false)}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer p-1"
              >
                <X size={24} />
              </button>
            </div>

            <p className="text-sm text-gray-400 mb-4 shrink-0">
              Files uploaded in this conversation:
            </p>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
              {chatDocuments.length === 0 ? (
                <div className="text-center py-8 text-[#8E8E93] text-sm bg-[#1C1C1D] rounded-xl border border-white/5">
                  No documents found
                </div>
              ) : (
                chatDocuments.map((doc, idx) => (
                  <div
                    key={doc.id || idx}
                    className="flex items-center justify-between bg-[#1C1C1D] p-3 rounded-xl border border-white/5 hover:border-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3 overflow-hidden pr-3">
                      <div className="p-2 bg-[#3390EC]/10 rounded-lg shrink-0">
                        <FileText size={20} className="text-[#3390EC]" />
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
                      className="p-2 text-[#8E8E93] hover:text-[#3390EC] hover:bg-white/10 rounded-lg transition-colors cursor-pointer shrink-0"
                      title="Download"
                    >
                      <Download size={20} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- МОДАЛЬНОЕ ОКНО ДЛЯ СРАВНЕНИЯ ФАЙЛОВ --- */}
      {isCompareModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-[#2C2C2E] rounded-2xl p-6 w-full max-w-sm border border-white/10 shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-white">
                Compare Documents
              </h2>
              <button
                onClick={() => setIsCompareModalOpen(false)}
                className="text-gray-400 hover:text-white cursor-pointer p-1"
              >
                <X size={24} />
              </button>
            </div>
            <p className="text-sm text-gray-400 mb-6">
              Upload the old and new versions of a document to analyze the
              changes.
            </p>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300 block mb-2">
                  Old Version
                </label>
                <input
                  type="file"
                  onChange={(e) => setOldFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#3A3A3C] file:text-white hover:file:bg-[#4A4A4C] cursor-pointer"
                />
                {oldFile && (
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    {oldFile.name}
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 block mb-2">
                  New Version
                </label>
                <input
                  type="file"
                  onChange={(e) => setNewFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#3A3A3C] file:text-white hover:file:bg-[#4A4A4C] cursor-pointer"
                />
                {newFile && (
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    {newFile.name}
                  </p>
                )}
              </div>
            </div>
            {compareError && (
              <p className="text-sm text-red-500 mt-4">{compareError}</p>
            )}
            <button
              onClick={handleCompareFiles}
              disabled={!oldFile || !newFile || isComparing}
              className="w-full bg-[#3390EC] text-white font-semibold py-2.5 rounded-lg mt-6 disabled:opacity-50 transition-all active:scale-95 cursor-pointer"
            >
              {isComparing ? "Analyzing..." : "Compare Files"}
            </button>
          </div>
        </div>
      )}

      {/* --- НИЖНЯЯ ПАНЕЛЬ --- */}
      <div
        className="fixed bottom-0 left-0 right-0 flex flex-col pt-2 pb-5 px-3 backdrop-blur-md max-w-md mx-auto z-40"
        style={{ backgroundColor: "rgba(28, 28, 29, 0.95)" }}
      >
        <div className="flex overflow-x-auto gap-2 pb-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] -mx-3 px-3">
          {["Summarize Doc", "Civil Code", "Check Contract"].map((text) => (
            <button
              key={text}
              onClick={() => handleSend(text)}
              disabled={isTyping}
              className="whitespace-nowrap px-4 py-1.5 rounded-full text-[13px] font-medium border text-white transition-colors cursor-pointer hover:bg-white/10 disabled:opacity-50"
              style={{
                backgroundColor: COLORS.surface,
                borderColor: "#3A3A3C",
              }}
            >
              {text}
            </button>
          ))}
        </div>
        <div className="flex items-end gap-2">
          <button
            onClick={() => setIsCompareModalOpen(true)}
            className="p-2.5 text-[#8E8E93] hover:text-white transition-colors pb-3 cursor-pointer"
          >
            <Paperclip size={24} className="rotate-45" />
          </button>
          <div
            className="flex-1 min-h-[44px] rounded-2xl px-3 py-2.5 flex items-center border border-white/5"
            style={{ backgroundColor: COLORS.surface }}
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend();
              }}
              placeholder="Ask a legal question..."
              className="bg-transparent border-none outline-none text-white text-[15px] w-full placeholder:text-[#8E8E93]"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={isTyping || !inputText.trim()}
            className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 shadow-sm transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
            style={{ backgroundColor: COLORS.primary }}
          >
            <Send size={20} color="white" className="ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
