
import { useState, useRef, useEffect, useCallback } from "react";

export const useChatMessages = (
  chatId: string | undefined,
  isTyping: boolean,
  hasAttachedFiles: boolean,
) => {
  const [messages, setMessages] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isUserScrollingUp, setIsUserScrollingUp] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<
    number | string | null
  >(null);

  
  const handleCopy = useCallback((text: string, id: number | string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  }, []);

  
  const scrollToBottom = useCallback(() => {
    
    if (!isUserScrollingUp) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isUserScrollingUp]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, hasAttachedFiles, scrollToBottom]);

  return {
    messages,
    setMessages,
    messagesEndRef,
    scrollContainerRef,
    setIsUserScrollingUp,
    copiedMessageId,
    handleCopy,
  };
};
