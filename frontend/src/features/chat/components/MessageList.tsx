// src/features/chat/components/MessageList.tsx
import React, { useState, useEffect, useRef } from "react";
import { Scale } from "lucide-react";
import { MessageBubble } from "./MessageBubble";
import { formatDateLabel } from "../../../utils/dateUtils";
import { motion, AnimatePresence } from "motion/react";
interface MessageListProps {
  messages: any[];
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  setIsUserScrollingUp: (val: boolean) => void;
  copiedMessageId: string | number | null;
  onCopy: (text: string, id: string | number) => void;
  onOpenDownload: () => void;
  onExportDocx: () => void; // <-- ДОБАВИЛИ
  isTyping: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  messagesEndRef,
  scrollContainerRef,
  setIsUserScrollingUp,
  copiedMessageId,
  onCopy,
  onOpenDownload,
  onExportDocx, // <-- ДОСТАЛИ ИЗ ПРОПСОВ
  isTyping,
}) => {
  const [isScrolling, setIsScrolling] = useState(false);
  const [floatingDate, setFloatingDate] = useState<string | null>(null);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastScrollCheck = useRef<number>(0);

  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
  const lastUserMsgId = lastUserMsg?.id;

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
    const target = e.currentTarget;

    const isNearBottom =
      target.scrollHeight - target.scrollTop - target.clientHeight < 100;
    setIsUserScrollingUp(!isNearBottom);

    setIsScrolling(true);
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => setIsScrolling(false), 1200);

    const now = Date.now();
    if (now - lastScrollCheck.current > 100) {
      lastScrollCheck.current = now;
      const groups = target.querySelectorAll(".message-group");
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

  return (
    <div
      ref={scrollContainerRef}
      className="flex-1 overflow-y-auto px-4 pt-2 pb-[160px] z-10 relative bg-[var(--tg-theme-bg-color)] scroll-smooth"
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
        <div className="flex flex-col items-center justify-center h-full text-center text-[var(--tg-theme-text-color)] mt-10">
          <div className="w-20 h-20 bg-[#F0F8FF] rounded-full flex items-center justify-center mb-4 shadow-sm">
            <Scale size={36} className="text-[var(--tg-theme-button-color)]" />
          </div>
          <p className="text-[20px] font-semibold text-[var(--tg-theme-text-color)] mb-2">
            Готов помочь
          </p>
          <p className="text-[15px] text-[var(--tg-theme-hint-color)] max-w-[260px] leading-relaxed">
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
                  <span className="bg-black/10 text-[var(--tg-theme-text-color)]/60 text-[12px] font-medium px-3 py-1 rounded-full">
                    {group.label}
                  </span>
                </div>
              )}
              {/* Оборачиваем список в AnimatePresence для поддержки появления */}
              <AnimatePresence initial={false}>
                {group.messages.map((msg, index) => (
                  <motion.div
                    key={`${msg.id ?? msg.created_at ?? "msg"}-${index}`}
                    layout // Автоматически двигает старые сообщения вверх при появлении новых
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="w-full"
                  >
                    <MessageBubble
                      msg={msg}
                      copiedMessageId={copiedMessageId}
                      onCopy={onCopy}
                      onDownloadClick={onOpenDownload}
                      onExportDocx={onExportDocx}
                      isScanning={isTyping && msg.id === lastUserMsgId}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );
};
