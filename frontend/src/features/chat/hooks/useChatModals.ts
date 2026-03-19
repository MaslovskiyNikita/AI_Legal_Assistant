
import { useState } from "react";

export const useChatModals = () => {
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isFileLimitModalOpen, setIsFileLimitModalOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  return {
    isCompareModalOpen,
    setIsCompareModalOpen,
    isFileLimitModalOpen,
    setIsFileLimitModalOpen,
    isDownloadModalOpen,
    setIsDownloadModalOpen,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    isExportModalOpen,
    setIsExportModalOpen,
  };
};
