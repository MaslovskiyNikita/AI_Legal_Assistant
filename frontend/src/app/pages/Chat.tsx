// src/app/pages/Chat.tsx
import React, { useEffect, useState, useRef } from "react";
import {
  ChevronLeft,
  MoreVertical,
  Paperclip,
  Send,
  Shield,
  Scale,
  CheckCircle2,
} from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { apiClient } from "../api/client";
import { TELEGRAM_USER } from "../../utils/telegram";

const COLORS = {
  bg: "#1C1C1D",
  surface: "#2C2C2E",
  primary: "#3390EC",
};

export default function Chat() {
  const navigate = useNavigate();
  const { chatId } = useParams();

  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Обработчик загрузки файла
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Генерируем временный ID для UI
    const tempUserId = Date.now();

    const userMsg = {
      id: tempUserId,
      role: "user",
      content: `📎 Загружен файл: ${file.name}`,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    let activeChatId = chatId;

    try {
      // 1. Если это новый чат, сначала создаем его на бэкенде
      if (activeChatId === "new") {
        const newChat = await apiClient.createChat({
          user_id: TELEGRAM_USER.id,
          title: `File: ${file.name.substring(0, 20)}...`,
        });
        activeChatId = newChat.id.toString();
        window.history.replaceState(null, "", `/chat/${activeChatId}`);
      }

      setIsTyping(true);

      // 2. пустой ответ
      const assistantMsgId = Date.now() + 1;
      const responseText = `Я получил файл "${file.name}". Хотите, чтобы я проанализировал его ключевые пункты или сравнил с другим документом?`;

      setMessages((prev) => [
        ...prev,
        {
          id: assistantMsgId,
          role: "assistant",
          content: responseText,
          created_at: new Date().toISOString(),
        },
      ]);

      // 3. Сохраняем это в моковую базу данных, чтобы осталось в истории
      await apiClient.uploadFileToChat(Number(activeChatId), file.name);
    } catch (error) {
      console.error("Error uploading file:", error);
      setMessages((prev) => prev.filter((msg) => msg.id !== tempUserId));
    } finally {
      setIsTyping(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Плавная прокрутка вниз
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Загрузка существующего чата
  useEffect(() => {
    if (chatId && chatId !== "new") {
      apiClient
        .getChat(Number(chatId))
        .then((res) => {
          setMessages(res.messages || []);
        })
        .catch((err) => console.error("Failed to load chat", err));
    } else {
      setMessages([]);
    }
  }, [chatId]);

  const handleSend = async (textOverride?: string | React.MouseEvent) => {
    const textToSend =
      typeof textOverride === "string" ? textOverride : inputText;

    if (!textToSend.trim() || isTyping) return;

    setInputText("");

    const tempUserId = Date.now();

    // Добавляем сообщение юзера в UI сразу
    const userMsg = {
      id: tempUserId,
      role: "user",
      content: textToSend,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    let activeChatId = chatId;

    try {
      // 1. Если это новый чат, сначала создаем его на бэкенде
      if (activeChatId === "new") {
        const newChat = await apiClient.createChat({
          user_id: TELEGRAM_USER.id,
          title: textToSend.substring(0, 30) + "...",
        });
        activeChatId = newChat.id.toString();
        // В фоне меняем URL, чтобы юзер остался в созданном чате
        window.history.replaceState(null, "", `/chat/${activeChatId}`);
      }

      // 2. Добавляем пустой ответ ассистента, который мы будем заполнять стримом
      const assistantMsgId = Date.now() + 1;
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMsgId,
          role: "assistant",
          content: "",
          created_at: new Date().toISOString(),
        },
      ]);

      // 3. Отправляем сообщение и слушаем потоковый ответ (SSE)
      await apiClient.sendMessageStream(
        Number(activeChatId),
        { text: textToSend },
        (chunk) => {
          // По мере прихода слов от ИИ, добавляем их к последнему сообщению
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? { ...msg, content: msg.content + chunk }
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
          className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-[15px] leading-snug text-white shadow-sm
            ${isUser ? "rounded-tr-sm" : "rounded-tl-sm"}`}
          style={{ backgroundColor: isUser ? COLORS.primary : COLORS.surface }}
        >
          {msg.content}

          <div
            className={`text-[11px] text-right mt-1 -mb-1 flex items-center gap-1
            ${isUser ? "justify-end text-white/70" : "justify-end text-[#8E8E93]"}`}
          >
            {timeString}{" "}
            {isUser && <CheckCircle2 size={12} className="inline" />}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full relative flex flex-col bg-[#1C1C1D]">
      {/* Header */}
      <div
        className="h-14 px-3 flex items-center justify-between border-b border-black/20 sticky top-0 z-10"
        style={{ backgroundColor: COLORS.surface }}
      >
        <div className="flex items-center gap-2">
          {/* Кнопка НАЗАД */}
          <button
            onClick={() => navigate(-1)}
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
        <button className="text-white p-1 hover:bg-white/10 rounded-full transition-colors cursor-pointer">
          <MoreVertical size={24} />
        </button>
      </div>

      {/* Chat Area - Динамический рендер */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 pb-32">
        {chatId === "new" && messages.length === 0 ? (
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

            {messages.map((msg) => renderMessage(msg))}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Bottom Input Area */}
      <div
        className="fixed bottom-0 left-0 right-0 flex flex-col pt-2 pb-5 px-3 backdrop-blur-md max-w-md mx-auto z-50"
        style={{ backgroundColor: "rgba(28, 28, 29, 0.95)" }}
      >
        {/* Quick Action Chips */}
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

        {/* Text Input */}
        <div className="flex items-end gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept=".pdf,.doc,.docx,.txt"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
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
