
import { useState } from "react";

export const useChatFiles = () => {
  const [chatDocuments, setChatDocuments] = useState<any[]>([]);
  const [oldFile, setOldFile] = useState<File | null>(null);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  
  const hasAttachedFiles = Boolean(oldFile && newFile);
  const isFilesAttachedToChat = chatDocuments.length >= 2;
  const canAttachFiles = !isFilesAttachedToChat;
  const shouldShowAttachedIcon = hasAttachedFiles || isFilesAttachedToChat;

  return {
    chatDocuments,
    setChatDocuments,
    oldFile,
    setOldFile,
    newFile,
    setNewFile,
    isExporting,
    setIsExporting,
    hasAttachedFiles,
    canAttachFiles,
    shouldShowAttachedIcon,
  };
};
