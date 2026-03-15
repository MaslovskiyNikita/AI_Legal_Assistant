// src/app/pages/Chat.tsx
import React, { useEffect, useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ChevronLeft,
  MoreVertical,
  Paperclip,
  ArrowUp,
  Scale,
  CheckCheck,
  X,
  Download,
  FileText,
  Trash2,
  Share2,
  Loader2,
  Copy,
  Check,
  Files,
} from "lucide-react";
import { useNavigate, useParams, useLocation } from "react-router";
import { apiClient } from "../api/client";
import { exportToDocx, exportToPdf } from "../../utils/exportUtils";

// Иконка формата файла
const FileIcon = ({ filename }: { filename: string }) => {
  const ext = filename?.split(".").pop()?.toLowerCase();
  let color = "text-[#3390EC]";
  let label = "DOC";

  if (ext === "pdf") {
    color = "text-[#FF3B30]";
    label = "PDF";
  } else if (ext === "docx" || ext === "doc") {
    color = "text-[#3390EC]";
    label = "DOCX";
  }

  return (
    <div className="w-11 h-11 bg-white rounded-[12px] flex items-center justify-center shrink-0 shadow-sm">
      <span className={`${color} font-bold text-[11px]`}>{label}</span>
    </div>
  );
};

// Компонент стопки файлов в чате
const StackedFiles = ({
  file1,
  file2,
  onClick,
}: {
  file1: string;
  file2: string;
  onClick: () => void;
}) => {
  return (
    <div className="flex flex-col items-end my-1 mt-10 relative z-20">
      <div
        onClick={onClick}
        className="relative inline-flex cursor-pointer active:opacity-80 transition-opacity"
      >
        <div className="absolute inset-0 bg-[#297acc] rounded-[20px] p-2.5 pr-5 flex items-center shadow-md border border-white/20 transform origin-bottom-right rotate-[4deg] -translate-y-5 translate-x-2 z-0">
          <FileIcon filename={file1} />
          <div className="ml-3 flex flex-col flex-1 min-w-0">
            <span className="text-white text-[15px] font-medium truncate">
              {file1.replace(/\.(pdf|docx?)$/i, "")}
            </span>
            <span className="text-blue-100/80 text-[13px] mt-0.5">
              Старая версия
            </span>
          </div>
        </div>
        <div className="relative min-w-[200px] max-w-[280px] bg-[#3390EC] rounded-[20px] p-2.5 pr-5 flex items-center shadow-lg border border-white/20 z-10">
          <FileIcon filename={file2} />
          <div className="ml-3 flex flex-col flex-1 min-w-0">
            <span className="text-white text-[16px] font-medium truncate">
              {file2.replace(/\.(pdf|docx?)$/i, "")}
            </span>
            <span className="text-blue-100/80 text-[13px] mt-0.5">
              Новая версия
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Форматирование дат
const formatDateLabel = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return "Сегодня";
  } else if (date.toDateString() === yesterday.toDateString()) {
    return "Вчера";
  } else {
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
    });
  }
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

  const [isScrolling, setIsScrolling] = useState(false);
  const [floatingDate, setFloatingDate] = useState<string | null>(null);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastScrollCheck = useRef<number>(0);

  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [oldFile, setOldFile] = useState<File | null>(null);
  const [newFile, setNewFile] = useState<File | null>(null);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [chatDocuments, setChatDocuments] = useState<any[]>([]);
  const [copiedMessageId, setCopiedMessageId] = useState<
    number | string | null
  >(null);

  const hasAttachedFiles = Boolean(oldFile && newFile);
  const isFilesAttachedToChat = chatDocuments.length >= 2;
  const canAttachFiles = !isFilesAttachedToChat;

  // Иконка стопки файлов будет отображаться если файлы выбраны СЕЙЧАС или УЖЕ загружены в этот чат
  const shouldShowAttachedIcon = hasAttachedFiles || isFilesAttachedToChat;

  const handleCopy = (text: string, id: number | string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, oldFile, newFile]);

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
            (msg: any) => ({
              ...msg,
              isComplete: true,
            }),
          );
          setMessages(historicalMessages);
          setChatDocuments(docsRes || []);
        })
        .catch((err) => console.error("Failed to load chat or documents", err));
    } else if (currentChatId === "new") {
      if (!hasHandledInitialPrompt.current) {
        setMessages([]);
        setChatDocuments([]);
      }
    }
  }, [currentChatId]);

  useEffect(() => {
    const prompt = location.state?.initialPrompt;
    if (prompt && currentChatId === "new" && !hasHandledInitialPrompt.current) {
      hasHandledInitialPrompt.current = true;
      window.history.replaceState({}, document.title);
      setTimeout(async () => {
        await handleSend(prompt);
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

  const handleSend = async (textOverride?: string | React.MouseEvent) => {
    const textToSend =
      typeof textOverride === "string" ? textOverride : inputText;

    if (!textToSend.trim() && !hasAttachedFiles) return;
    if (isTyping) return;

    setInputText("");
    setIsTyping(true);

    const finalPrompt = textToSend.trim();

    let activeChatId = currentChatId;

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
        setCurrentChatId(activeChatId);
        navigate(`/chat/${activeChatId}`, { replace: true });
      }

      const userMsgId = `msg_${Date.now()}_user`;
      let userTextForUI = finalPrompt;

      // Формируем текст сообщения, не добавляя лишнего системного текста, если пользователь ничего не написал
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

  const groupedMessages: { label: string; messages: any[] }[] = [];
  let currentGroup: { label: string; messages: any[] } | null = null;

  messages.forEach((msg) => {
    const dateLabel = formatDateLabel(msg.created_at);
    if (!currentGroup || currentGroup.label !== dateLabel) {
      currentGroup = { label: dateLabel, messages: [] };
      groupedMessages.push(currentGroup);
    }
    currentGroup.messages.push(msg);
  });

  useEffect(() => {
    if (groupedMessages.length > 0 && !floatingDate) {
      setFloatingDate(groupedMessages[groupedMessages.length - 1].label);
    }
  }, [groupedMessages, floatingDate]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setIsScrolling(true);
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => setIsScrolling(false), 1200);

    const now = Date.now();
    if (now - lastScrollCheck.current > 100) {
      lastScrollCheck.current = now;
      const container = e.currentTarget;
      const groups = container.querySelectorAll(".message-group");
      let foundDate = floatingDate;

      for (let i = groups.length - 1; i >= 0; i--) {
        const rect = groups[i].getBoundingClientRect();
        if (rect.top <= 120) {
          foundDate = groups[i].getAttribute("data-date");
          break;
        }
      }

      if (!foundDate && groups.length > 0) {
        foundDate = groups[0].getAttribute("data-date");
      }

      if (foundDate && foundDate !== floatingDate) {
        setFloatingDate(foundDate);
      }
    }
  };

  const renderMessage = (msg: any) => {
    const isUser = msg.role === "user";
    const timeString = new Date(msg.created_at).toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const textContent = msg.text || msg.content || "";
    const showFooter = isUser || msg.isComplete;

    const spaceForTimeClass = isUser
      ? "last:after:content-[''] last:after:inline-block last:after:w-[54px] last:after:h-[10px]"
      : "last:after:content-[''] last:after:inline-block last:after:w-[68px] last:after:h-[10px]";

    const fileMatch = textContent.match(
      /Прикреплены документы для сравнения:\s*1\.\s*(.*?)\s*2\.\s*([^\n]+)/,
    );
    const isFileStack = isUser && fileMatch;

    // Если сообщение со стопкой файлов, достаем только реальный текст комментария (без префикса)
    let remainingText = "";
    if (isFileStack) {
      remainingText = textContent
        .replace(fileMatch[0], "")
        .replace(/^\n+/, "")
        .trim();
    }

    return (
      <div
        key={msg.id}
        className={`flex w-full min-w-0 ${isUser ? "justify-end" : "justify-start"} mb-3 relative z-20`}
      >
        <div
          className={`relative flex items-end min-w-0 ${isUser ? "ml-auto" : "mr-auto"} ${!isFileStack ? "max-w-[85%] sm:max-w-[75%]" : ""}`}
        >
          {!isUser && !isFileStack && (
            <svg
              viewBox="0 0 8 13"
              width="8"
              height="13"
              className="absolute -left-[7px] bottom-0 text-[#F2F2F7] fill-current shrink-0"
            >
              <path d="M8 0v13H0c3.9 0 8-4.2 8-13z" />
            </svg>
          )}

          {isFileStack ? (
            <div className="flex flex-col items-end">
              <StackedFiles
                file1={fileMatch[1]}
                file2={fileMatch[2]}
                onClick={() => setIsDownloadModalOpen(true)}
              />

              {/* Показываем пузырь с текстом только если пользователь действительно что-то написал */}
              {remainingText && (
                <div className="mt-2 relative px-3 pt-2 pb-2 text-[16px] leading-snug shadow-sm flex flex-col z-10 w-full min-w-0 break-words [word-break:break-word] bg-[#3390EC] text-white rounded-[18px] rounded-br-none">
                  <ReactMarkdown
                    components={{
                      p: ({ node, ref, ...props }) => (
                        <p
                          className={`mb-1 last:mb-0 whitespace-pre-wrap break-words inline-block w-full ${spaceForTimeClass}`}
                          {...props}
                        />
                      ),
                    }}
                  >
                    {remainingText}
                  </ReactMarkdown>

                  <div className="absolute bottom-[6px] right-[10px] flex items-center gap-[3px] text-[11px] font-medium select-none text-blue-100">
                    <span>{timeString}</span>
                    <CheckCheck size={14} className="text-white" />
                  </div>

                  <svg
                    viewBox="0 0 8 13"
                    width="8"
                    height="13"
                    className="absolute -right-[7px] bottom-0 text-[#3390EC] fill-current shrink-0"
                  >
                    <path d="M0 0v13h8c-3.9 0-8-4.2-8-13z" />
                  </svg>
                </div>
              )}
            </div>
          ) : (
            <div
              className={`relative px-3 pt-2 pb-2 text-[16px] leading-snug shadow-sm flex flex-col z-10 w-full min-w-0 break-words [word-break:break-word] ${isUser ? "bg-[#3390EC] text-white rounded-[18px] rounded-br-none" : "bg-[#F2F2F7] text-black rounded-[18px] rounded-bl-none"}`}
            >
              <div className="w-full min-w-0">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ node, ref, ...props }) => (
                      <p
                        className={`mb-1 last:mb-0 whitespace-pre-wrap break-words inline-block w-full ${showFooter ? spaceForTimeClass : ""}`}
                        {...props}
                      />
                    ),
                    table: ({ node, ref, ...props }) => (
                      <div
                        className={`overflow-x-auto my-2 rounded-xl bg-white text-black ${showFooter ? "last:mb-5" : ""}`}
                      >
                        <table
                          className="w-full text-left text-sm"
                          {...props}
                        />
                      </div>
                    ),
                    ul: ({ node, ref, ...props }) => (
                      <ul
                        className={`list-disc ml-5 mb-1 ${showFooter ? "last:mb-5" : ""}`}
                        {...props}
                      />
                    ),
                    ol: ({ node, ref, ...props }) => (
                      <ol
                        className={`list-decimal ml-5 mb-1 ${showFooter ? "last:mb-5" : ""}`}
                        {...props}
                      />
                    ),
                    th: ({ node, ref, ...props }) => (
                      <th
                        className="bg-[#F8F9FA] p-2 font-semibold border-b border-[#E5E5EA]"
                        {...props}
                      />
                    ),
                    td: ({ node, ref, ...props }) => (
                      <td
                        className="p-2 border-b border-[#E5E5EA] last:border-0"
                        {...props}
                      />
                    ),
                    a: ({ node, ref, ...props }) => (
                      <a
                        className={`${isUser ? "text-white underline" : "text-[#3390EC] underline"} break-all`}
                        {...props}
                      />
                    ),
                    li: ({ node, ref, ...props }) => (
                      <li className="mb-1 break-words" {...props} />
                    ),
                    strong: ({ node, ref, ...props }) => (
                      <strong className="font-semibold" {...props} />
                    ),
                  }}
                >
                  {textContent}
                </ReactMarkdown>
              </div>

              {showFooter && (
                <div
                  className={`absolute bottom-[6px] right-[10px] flex items-center gap-[3px] text-[11px] font-medium select-none ${isUser ? "text-blue-100" : "text-[#8E8E93]"}`}
                >
                  {!isUser && textContent && (
                    <button
                      onClick={() => handleCopy(textContent, msg.id)}
                      className="flex items-center hover:text-[#3390EC] transition-colors cursor-pointer mr-0.5"
                      title="Копировать"
                    >
                      {copiedMessageId === msg.id ? (
                        <Check size={14} className="text-[#3390EC]" />
                      ) : (
                        <Copy size={13} />
                      )}
                    </button>
                  )}
                  <span>{timeString}</span>
                  {isUser && <CheckCheck size={14} className="text-white" />}
                </div>
              )}
            </div>
          )}

          {isUser && !isFileStack && (
            <svg
              viewBox="0 0 8 13"
              width="8"
              height="13"
              className="absolute -right-[7px] bottom-0 text-[#3390EC] fill-current shrink-0"
            >
              <path d="M0 0v13h8c-3.9 0-8-4.2-8-13z" />
            </svg>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-[100dvh] w-full relative flex flex-col bg-[#FFFFFF] overflow-hidden font-sans">
      <div className="h-14 px-4 flex items-center justify-between sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-[#E5E5EA]">
        <button
          onClick={() => navigate("/profile")}
          className="flex items-center text-[#3390EC] active:opacity-70 transition-opacity cursor-pointer"
        >
          <ChevronLeft size={24} className="-ml-1" />
          <span className="text-[17px]">Назад</span>
        </button>
        <span className="absolute left-1/2 -translate-x-1/2 text-[17px] font-semibold text-black">
          Legal Expert
        </span>
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="w-8 h-8 flex items-center justify-end text-[#3390EC] active:opacity-70 transition-opacity cursor-pointer"
          >
            <MoreVertical size={24} />
          </button>
          {isMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsMenuOpen(false)}
              />
              <div className="absolute right-0 top-10 w-56 bg-white border border-[#E5E5EA] rounded-2xl shadow-xl z-50 overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-100">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsDownloadModalOpen(true);
                  }}
                  className="w-full text-left px-4 py-3 text-[15px] font-medium text-black active:bg-[#F2F2F7] transition-colors flex items-center gap-3 cursor-pointer"
                >
                  <Download size={18} className="text-[#3390EC]" /> Документы
                  чата
                </button>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsExportModalOpen(true);
                  }}
                  className="w-full text-left px-4 py-3 text-[15px] font-medium text-black active:bg-[#F2F2F7] transition-colors flex items-center gap-3 cursor-pointer"
                >
                  <Share2 size={18} className="text-[#3390EC]" /> Экспорт
                  переписки
                </button>
                {currentChatId && currentChatId !== "new" && (
                  <>
                    <div className="h-[1px] bg-[#E5E5EA] mx-4 my-1" />
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        setIsDeleteModalOpen(true);
                      }}
                      className="w-full text-left px-4 py-3 text-[15px] font-medium text-[#FF3B30] active:bg-[#F2F2F7] transition-colors flex items-center gap-3 cursor-pointer"
                    >
                      <Trash2 size={18} /> Удалить чат
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto px-4 pt-2 pb-[160px] z-10 relative bg-white scroll-smooth"
        onScroll={handleScroll}
      >
        {groupedMessages.length > 0 && (
          <div
            className={`sticky top-2 z-30 flex justify-center pointer-events-none transition-opacity duration-300 ${isScrolling && floatingDate ? "opacity-100" : "opacity-0"}`}
          >
            <span className="bg-black/15 backdrop-blur-md text-white text-[12px] font-medium px-3 py-1 rounded-full shadow-sm">
              {floatingDate}
            </span>
          </div>
        )}

        {groupedMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-black mt-10">
            <div className="w-20 h-20 bg-[#F0F8FF] rounded-full flex items-center justify-center mb-4 shadow-sm">
              <Scale size={36} className="text-[#3390EC]" />
            </div>
            <p className="text-[20px] font-semibold text-black mb-2">
              Готов помочь
            </p>
            <p className="text-[15px] text-[#8E8E93] max-w-[260px] leading-relaxed">
              Задайте юридический вопрос или прикрепите документ для анализа.
            </p>
          </div>
        ) : (
          <>
            {groupedMessages.map((group, groupIndex) => (
              <div
                key={`group-${group.label}-${groupIndex}`}
                className="flex flex-col relative pb-2 message-group"
                data-date={group.label}
              >
                {groupIndex !== 0 && (
                  <div className="flex justify-center my-3">
                    <span className="bg-black/10 text-black/60 text-[12px] font-medium px-3 py-1 rounded-full">
                      {group.label}
                    </span>
                  </div>
                )}
                {group.messages.map((msg, index) => (
                  <React.Fragment
                    key={`${msg.id ?? msg.created_at ?? "msg"}-${index}`}
                  >
                    {renderMessage(msg)}
                  </React.Fragment>
                ))}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* --- ОБЛАСТЬ ВВОДА --- */}
      <div className="absolute bottom-0 left-0 w-full flex flex-col pt-2 pb-6 px-4 backdrop-blur-xl bg-white/90 border-t border-[#E5E5EA] z-20">
        {oldFile && newFile && (
          <div className="mb-3 w-full bg-[#F2F2F7] border border-[#E5E5EA] rounded-2xl p-3 flex flex-col gap-2 relative animate-in slide-in-from-bottom-2 duration-200 shadow-sm">
            <button
              onClick={() => {
                setOldFile(null);
                setNewFile(null);
              }}
              className="absolute top-2 right-2 p-1 text-[#8E8E93] hover:text-[#FF3B30] transition-colors rounded-full cursor-pointer bg-white shadow-sm"
              title="Открепить файлы"
            >
              <X size={16} />
            </button>
            <span className="text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider pl-1">
              Будут отправлены
            </span>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2.5 text-[14px] text-black truncate pr-6 bg-white p-2 rounded-xl shadow-sm">
                <FileText size={18} className="text-[#3390EC] shrink-0" />
                <span className="truncate font-medium">{oldFile.name}</span>
              </div>
              <div className="flex items-center gap-2.5 text-[14px] text-black truncate pr-6 bg-white p-2 rounded-xl shadow-sm">
                <FileText size={18} className="text-[#3390EC] shrink-0" />
                <span className="truncate font-medium">{newFile.name}</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-end gap-2">
          {/* Скрепка всегда на месте. Меняет вид, если файлы прикреплены. */}
          <button
            onClick={() => {
              if (!canAttachFiles) {
                alert(
                  "В этом чате уже прикреплены документы.\nДля сравнения новых файлов, пожалуйста, создайте новый чат.",
                );
                return;
              }
              setIsCompareModalOpen(true);
            }}
            className={`w-10 h-10 mb-1 flex items-center justify-center rounded-full transition-colors shrink-0 cursor-pointer ${
              shouldShowAttachedIcon
                ? "text-[#3390EC] bg-[#E5F1FF]"
                : "text-[#8E8E93] hover:text-[#3390EC]"
            }`}
          >
            {shouldShowAttachedIcon ? (
              <Files size={22} />
            ) : (
              <Paperclip size={24} className="rotate-45" />
            )}
          </button>

          <div className="flex-1 bg-[#F2F2F7] border border-[#E5E5EA] rounded-3xl min-h-[44px] max-h-[120px] flex items-end px-4 py-1.5 focus-within:border-[#3390EC] transition-colors">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={
                hasAttachedFiles
                  ? "Напишите сообщение..."
                  : "Напишите сообщение..."
              }
              rows={1}
              className="flex-1 max-h-[100px] bg-transparent border-none outline-none text-black text-[16px] placeholder:text-[#8E8E93] resize-none py-1.5"
            />
          </div>

          <button
            onClick={() => handleSend()}
            disabled={isTyping || (!inputText.trim() && !hasAttachedFiles)}
            className={`w-[44px] h-[44px] shrink-0 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-sm mb-0.5
              ${
                inputText.trim() || hasAttachedFiles
                  ? "bg-[#3390EC] text-white shadow-blue-500/30"
                  : "bg-[#E5E5EA] text-[#8E8E93] cursor-not-allowed"
              }
            `}
          >
            {isTyping ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <ArrowUp size={20} strokeWidth={2.5} />
            )}
          </button>
        </div>
      </div>

      {/* --- МОДАЛКИ --- */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-[300px] flex flex-col items-center text-center overflow-hidden animate-in zoom-in-95 duration-200 shadow-2xl">
            <div className="p-6 pb-5">
              <h2 className="text-[17px] font-semibold text-black mb-1.5">
                Удалить чат?
              </h2>
              <p className="text-[13px] text-[#8E8E93] leading-snug">
                Это действие нельзя будет отменить.
              </p>
            </div>
            <div className="flex flex-col w-full border-t border-[#E5E5EA]">
              <button
                onClick={executeDeleteChat}
                className="w-full py-3.5 text-[17px] font-normal text-[#FF3B30] border-b border-[#E5E5EA] active:bg-[#F2F2F7] transition-colors"
              >
                Удалить
              </button>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="w-full py-3.5 text-[17px] font-semibold text-[#3390EC] active:bg-[#F2F2F7] transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {isDownloadModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center mb-4 shrink-0">
              <h2 className="text-[17px] font-semibold text-black">
                Документы чата
              </h2>
              <button
                onClick={() => setIsDownloadModalOpen(false)}
                className="text-[#8E8E93] hover:text-black transition-colors bg-[#F2F2F7] rounded-full p-1"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {chatDocuments.length === 0 ? (
                <div className="text-center py-8 text-[#8E8E93] text-[15px]">
                  Нет прикрепленных документов
                </div>
              ) : (
                chatDocuments.map((doc, idx) => (
                  <div
                    key={doc.id || idx}
                    className="flex items-center justify-between bg-[#F2F2F7] p-3 rounded-2xl"
                  >
                    <div className="flex items-center gap-3 overflow-hidden pr-3">
                      <FileIcon filename={doc.filename || doc.name || ""} />
                      <span className="text-[15px] font-medium text-black truncate">
                        {doc.filename || doc.name || `Документ #${doc.id}`}
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        apiClient.downloadDocument(
                          doc.id,
                          doc.filename || "document",
                        )
                      }
                      className="p-2 text-[#3390EC] bg-white rounded-xl shadow-sm border border-[#E5E5EA] active:bg-[#F2F2F7] transition-colors shrink-0"
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-[300px] flex flex-col items-center text-center overflow-hidden shadow-2xl">
            <div className="p-6 pb-5 w-full">
              <div className="w-14 h-14 bg-[#F0F8FF] rounded-full flex items-center justify-center mx-auto mb-4">
                <Share2 size={28} className="text-[#3390EC]" />
              </div>
              <h2 className="text-[17px] font-semibold text-black mb-1.5">
                Экспорт чата
              </h2>
              <p className="text-[13px] text-[#8E8E93] leading-snug mb-2">
                Сохранить историю переписки на устройство.
              </p>
            </div>
            <div className="flex flex-col w-full border-t border-[#E5E5EA]">
              <button
                onClick={() => handleExport("docx")}
                disabled={isExporting}
                className="w-full py-3.5 text-[17px] font-normal text-black border-b border-[#E5E5EA] active:bg-[#F2F2F7] transition-colors"
              >
                {isExporting ? "Экспорт..." : "Скачать в .DOCX"}
              </button>
              <button
                onClick={() => handleExport("pdf")}
                disabled={isExporting}
                className="w-full py-3.5 text-[17px] font-normal text-black border-b border-[#E5E5EA] active:bg-[#F2F2F7] transition-colors"
              >
                {isExporting ? "Экспорт..." : "Скачать в .PDF"}
              </button>
              <button
                onClick={() => setIsExportModalOpen(false)}
                disabled={isExporting}
                className="w-full py-3.5 text-[17px] font-semibold text-[#FF3B30] active:bg-[#F2F2F7] transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {isCompareModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-[#E5E5EA]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[17px] font-semibold text-black">
                Прикрепить файлы
              </h2>
              <button
                onClick={() => setIsCompareModalOpen(false)}
                className="text-[#8E8E93] hover:text-black bg-[#F2F2F7] rounded-full p-1 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[13px] font-medium text-[#8E8E93] uppercase tracking-wider block mb-2">
                  Старая версия
                </label>
                <input
                  type="file"
                  onChange={(e) => setOldFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-black file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-[#F2F2F7] file:text-[#3390EC] hover:file:bg-[#E5E5EA] cursor-pointer"
                />
              </div>
              <div className="h-[1px] bg-[#E5E5EA]" />
              <div>
                <label className="text-[13px] font-medium text-[#8E8E93] uppercase tracking-wider block mb-2">
                  Новая версия
                </label>
                <input
                  type="file"
                  onChange={(e) => setNewFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-black file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-[#F2F2F7] file:text-[#3390EC] hover:file:bg-[#E5E5EA] cursor-pointer"
                />
              </div>
            </div>

            <button
              onClick={() => setIsCompareModalOpen(false)}
              disabled={!oldFile || !newFile}
              className="w-full bg-[#3390EC] text-white font-semibold text-[16px] py-3.5 rounded-xl mt-6 disabled:opacity-50 active:bg-blue-600 transition-colors shadow-sm shadow-blue-500/30 flex items-center justify-center gap-2"
            >
              Сохранить выбор
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
