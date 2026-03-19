
import React from "react";
import { useParams } from "react-router";
import { useChat } from "../features/chat/hooks/useChat";

import { ChatHeader } from "../features/chat/components/ChatHeader";
import { ChatInput } from "../features/chat/components/ChatInput";
import { MessageList } from "../features/chat/components/MessageList";
import { ChatModals } from "../features/chat/components/ChatModals";

export default function Chat() {
  const { chatId } = useParams();
  const chat = useChat(chatId);

  return (
    <div className="h-[100dvh] w-full relative flex flex-col bg-[var(--tg-theme-bg-color)] overflow-hidden font-sans">
      <ChatHeader
        
        chatId={chat.chatId}
        onOpenDownload={() => chat.setIsDownloadModalOpen(true)}
        onOpenExport={() => chat.setIsExportModalOpen(true)}
        onOpenDelete={() => chat.setIsDeleteModalOpen(true)}
      />

      <MessageList
        messages={chat.messages}
        messagesEndRef={chat.messagesEndRef}
        scrollContainerRef={chat.scrollContainerRef}
        setIsUserScrollingUp={chat.setIsUserScrollingUp}
        copiedMessageId={chat.copiedMessageId}
        onCopy={chat.handleCopy}
        onOpenDownload={() => chat.setIsDownloadModalOpen(true)}
        onExportDocx={() => chat.handleExport("docx")}
        isTyping={chat.isTyping}
      />

      <ChatInput
        inputText={chat.inputText}
        setInputText={chat.setInputText}
        isTyping={chat.isTyping}
        handleSend={chat.handleSend}
        oldFile={chat.oldFile}
        newFile={chat.newFile}
        setOldFile={chat.setOldFile}
        setNewFile={chat.setNewFile}
        canAttachFiles={chat.canAttachFiles}
        shouldShowAttachedIcon={chat.shouldShowAttachedIcon}
        onOpenCompareModal={() => chat.setIsCompareModalOpen(true)}
        onOpenFileLimitModal={() => chat.setIsFileLimitModalOpen(true)}
      />

      <ChatModals
        isDeleteModalOpen={chat.isDeleteModalOpen}
        setIsDeleteModalOpen={chat.setIsDeleteModalOpen}
        executeDeleteChat={chat.executeDeleteChat}
        isDownloadModalOpen={chat.isDownloadModalOpen}
        setIsDownloadModalOpen={chat.setIsDownloadModalOpen}
        chatDocuments={chat.chatDocuments}
        isExportModalOpen={chat.isExportModalOpen}
        setIsExportModalOpen={chat.setIsExportModalOpen}
        isExporting={chat.isExporting}
        handleExport={chat.handleExport}
        isCompareModalOpen={chat.isCompareModalOpen}
        setIsCompareModalOpen={chat.setIsCompareModalOpen}
        oldFile={chat.oldFile}
        setOldFile={chat.setOldFile}
        newFile={chat.newFile}
        setNewFile={chat.setNewFile}
        isFileLimitModalOpen={chat.isFileLimitModalOpen}
        setIsFileLimitModalOpen={chat.setIsFileLimitModalOpen}
      />
    </div>
  );
}
