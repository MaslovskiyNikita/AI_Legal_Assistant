// src/features/chat/components/ChatModals.tsx
import React, { useState } from "react";
import { Drawer } from "vaul";
import {
  X,
  Download,
  Share2,
  UploadCloud,
  Trash2,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { useNavigate } from "react-router";
import { FileIcon } from "../../../components/ui/FileIcon";
import { apiClient } from "../../../api/client";
import { formatFileSize } from "../../../utils/fileUtils";
import { useToast } from "../../../hooks/useToast";
import { tgHaptic, tgHapticNotification } from "../../../utils/telegram";

interface ChatModalsProps {
  isDeleteModalOpen: boolean;
  setIsDeleteModalOpen: (val: boolean) => void;
  executeDeleteChat: () => void;
  isDownloadModalOpen: boolean;
  setIsDownloadModalOpen: (val: boolean) => void;
  chatDocuments: any[];
  isExportModalOpen: boolean;
  setIsExportModalOpen: (val: boolean) => void;
  isExporting: boolean;
  handleExport: (format: "docx" | "pdf") => void;
  isCompareModalOpen: boolean;
  setIsCompareModalOpen: (val: boolean) => void;
  oldFile: File | null;
  setOldFile: (file: File | null) => void;
  newFile: File | null;
  setNewFile: (file: File | null) => void;
  isFileLimitModalOpen: boolean;
  setIsFileLimitModalOpen: (val: boolean) => void;
}

// === НОВЫЙ КОМПОНЕНТ ДЛЯ DRAG & DROP ===
const DropzoneArea = ({
  id,
  onFileSelect,
}: {
  id: string;
  onFileSelect: (file: File | null) => void;
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

  return (
    <label
      htmlFor={id}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer ${
        isDragging
          ? "border-[var(--tg-theme-button-color)] bg-[color-mix(in_srgb,var(--tg-theme-button-color)_10%,transparent)] scale-[1.02]"
          : "border-[var(--tg-theme-section-separator-color,rgba(128,128,128,0.2))] bg-[var(--tg-theme-secondary-bg-color)] hover:opacity-80"
      }`}
    >
      <UploadCloud
        size={28}
        className={`mb-2 transition-colors ${
          isDragging
            ? "text-[var(--tg-theme-button-color)]"
            : "text-[var(--tg-theme-button-color)]"
        }`}
      />
      <p className="text-[15px] text-[var(--tg-theme-text-color)] font-medium pointer-events-none">
        {isDragging ? "Отпустите файл здесь" : "Выбрать или перетащить файл"}
      </p>
      <p className="text-[12px] text-[var(--tg-theme-hint-color)] mt-0.5 pointer-events-none">
        PDF, DOCX до 10 МБ
      </p>
      <input
        id={id}
        type="file"
        className="hidden"
        onChange={(e) => onFileSelect(e.target.files?.[0] || null)}
        accept=".pdf,.doc,.docx"
      />
    </label>
  );
};

export const ChatModals: React.FC<ChatModalsProps> = (props) => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleFileSelect = (
    file: File | null,
    setFile: (f: File | null) => void,
  ) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      showToast("Файл слишком большой. Максимум 10 МБ.", "error");
      return;
    }
    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (
      !validTypes.includes(file.type) &&
      !file.name.match(/\.(pdf|doc|docx)$/i)
    ) {
      showToast("Неверный формат. Загрузите PDF или DOCX.", "error");
      return;
    }

    tgHaptic("light"); // Даем виброотклик при успешном выборе/дропе
    setFile(file);
  };

  return (
    <>
      {/* 1. Удалить чат */}
      <Drawer.Root
        open={props.isDeleteModalOpen}
        onOpenChange={(open) => {
          if (open) tgHaptic("light");
          props.setIsDeleteModalOpen(open);
        }}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
          <Drawer.Content
            className="bg-[var(--tg-theme-bg-color)] flex flex-col rounded-t-[24px] mt-24 fixed bottom-0 left-0 right-0 z-[60] outline-none"
            style={{ paddingBottom: "var(--safe-bottom)" }}
          >
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-[var(--tg-theme-hint-color)] opacity-20 mt-4 mb-2" />
            <div className="p-5 pb-10">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-16 h-16 bg-[#FFEBEA] rounded-full flex items-center justify-center mb-4">
                  <Trash2 size={28} className="text-[#FF3B30]" />
                </div>
                <Drawer.Title className="text-[20px] font-bold text-[var(--tg-theme-text-color)] mb-2">
                  Удалить этот чат?
                </Drawer.Title>
                <Drawer.Description className="text-[15px] text-[var(--tg-theme-hint-color)] leading-snug max-w-[280px]">
                  Переписка и прикрепленные файлы будут удалены навсегда.
                </Drawer.Description>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    tgHaptic("rigid");
                    props.executeDeleteChat();
                  }}
                  className="w-full py-4 bg-[#FF3B30] text-white rounded-xl text-[17px] font-semibold active:scale-[0.98] transition-all"
                >
                  Удалить
                </button>
                <Drawer.Close asChild>
                  <button className="w-full py-4 bg-[var(--tg-theme-secondary-bg-color)] text-[var(--tg-theme-text-color)] rounded-xl text-[17px] font-semibold active:scale-[0.98] transition-all">
                    Отмена
                  </button>
                </Drawer.Close>
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* 2. Документы чата (Скачивание) */}
      <Drawer.Root
        open={props.isDownloadModalOpen}
        onOpenChange={(open) => {
          if (open) tgHaptic("light");
          props.setIsDownloadModalOpen(open);
        }}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
          <Drawer.Content
            className="bg-[var(--tg-theme-bg-color)] flex flex-col rounded-t-[24px] mt-24 fixed bottom-0 left-0 right-0 z-[60] outline-none max-h-[80vh]"
            style={{ paddingBottom: "var(--safe-bottom)" }}
          >
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-[var(--tg-theme-hint-color)] opacity-20 mt-4 mb-2" />
            <div className="px-5 pb-3 flex items-center gap-3 border-b border-[var(--tg-theme-section-separator-color,rgba(128,128,128,0.2))]">
              <div className="w-10 h-10 bg-[color-mix(in_srgb,var(--tg-theme-button-color)_10%,transparent)] text-[var(--tg-theme-button-color)] rounded-full flex items-center justify-center">
                <FileText size={20} />
              </div>
              <Drawer.Title className="text-[20px] font-bold text-[var(--tg-theme-text-color)]">
                Документы чата
              </Drawer.Title>
              <Drawer.Description className="sr-only">
                Список прикрепленных файлов
              </Drawer.Description>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-3 pb-10">
              {props.chatDocuments.length === 0 ? (
                <div className="text-center py-8 text-[var(--tg-theme-hint-color)] text-[15px]">
                  Нет прикрепленных документов
                </div>
              ) : (
                props.chatDocuments.map((doc, idx) => (
                  <div
                    key={doc.id || idx}
                    className="flex items-center justify-between bg-[var(--tg-theme-secondary-bg-color)] p-3 rounded-2xl"
                  >
                    <div className="flex items-center gap-3 overflow-hidden pr-3">
                      <FileIcon filename={doc.filename || doc.name || ""} />
                      <span className="text-[15px] font-medium text-[var(--tg-theme-text-color)] truncate">
                        {doc.filename || doc.name || `Документ #${doc.id}`}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        tgHaptic("medium");
                        apiClient.downloadDocument(
                          doc.id,
                          doc.filename || "document",
                        );
                      }}
                      className="w-10 h-10 bg-[var(--tg-theme-bg-color)] rounded-full shadow-sm flex items-center justify-center text-[var(--tg-theme-button-color)] active:scale-95 transition-all shrink-0"
                    >
                      <Download size={18} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* 3. Экспорт переписки */}
      <Drawer.Root
        open={props.isExportModalOpen}
        onOpenChange={(open) => {
          if (open) tgHaptic("light");
          props.setIsExportModalOpen(open);
        }}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
          <Drawer.Content
            className="bg-[var(--tg-theme-bg-color)] flex flex-col rounded-t-[24px] mt-24 fixed bottom-0 left-0 right-0 z-[60] outline-none"
            style={{ paddingBottom: "var(--safe-bottom)" }}
          >
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-[var(--tg-theme-hint-color)] opacity-20 mt-4 mb-2" />
            <div className="p-5 pb-10">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-16 h-16 bg-[color-mix(in_srgb,var(--tg-theme-button-color)_10%,transparent)] text-[var(--tg-theme-button-color)] rounded-full flex items-center justify-center mb-4">
                  <Share2 size={28} />
                </div>
                <Drawer.Title className="text-[20px] font-bold text-[var(--tg-theme-text-color)] mb-2">
                  Экспорт чата
                </Drawer.Title>
                <Drawer.Description className="text-[15px] text-[var(--tg-theme-hint-color)] leading-snug">
                  Сохраните историю переписки на устройство для дальнейшей
                  работы.
                </Drawer.Description>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    tgHaptic("medium");
                    props.handleExport("docx");
                  }}
                  disabled={props.isExporting}
                  className="w-full py-4 bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color,white)] rounded-xl text-[17px] font-semibold flex justify-center items-center gap-2 active:scale-[0.98] transition-all"
                >
                  {props.isExporting ? "Экспорт..." : "Скачать в формате .DOCX"}
                </button>
                <button
                  onClick={() => {
                    tgHaptic("medium");
                    props.handleExport("pdf");
                  }}
                  disabled={props.isExporting}
                  className="w-full py-4 bg-[var(--tg-theme-secondary-bg-color)] text-[var(--tg-theme-button-color)] rounded-xl text-[17px] font-semibold flex justify-center items-center gap-2 active:scale-[0.98] transition-all"
                >
                  {props.isExporting ? "Экспорт..." : "Скачать в формате .PDF"}
                </button>
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* 4. Прикрепить файлы (Compare) */}
      <Drawer.Root
        open={props.isCompareModalOpen}
        onOpenChange={(open) => {
          if (open) tgHaptic("light");
          props.setIsCompareModalOpen(open);
        }}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
          <Drawer.Content
            className="bg-[var(--tg-theme-secondary-bg-color)] flex flex-col rounded-t-[24px] mt-10 fixed bottom-0 left-0 right-0 z-[60] outline-none"
            style={{ paddingBottom: "var(--safe-bottom)" }}
          >
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-[var(--tg-theme-hint-color)] opacity-20 mt-4 mb-2" />
            <div className="px-5 pb-3 pt-2 text-center">
              <Drawer.Title className="text-[20px] font-bold text-[var(--tg-theme-text-color)]">
                Сравнение документов
              </Drawer.Title>
              <Drawer.Description className="text-[14px] text-[var(--tg-theme-hint-color)] mt-1">
                Загрузите две версии документа для поиска изменений и рисков.
              </Drawer.Description>
            </div>

            <div className="p-5 pb-10 space-y-4">
              {/* Старая версия */}
              <div className="bg-[var(--tg-theme-bg-color)] p-4 rounded-2xl shadow-sm">
                <label className="text-[13px] font-bold text-[var(--tg-theme-hint-color)] uppercase tracking-wider block mb-3">
                  Старая редакция
                </label>
                {!props.oldFile ? (
                  <DropzoneArea
                    id="old-file"
                    onFileSelect={(file) =>
                      handleFileSelect(file, props.setOldFile)
                    }
                  />
                ) : (
                  <div className="flex items-center justify-between p-3 bg-[color-mix(in_srgb,var(--tg-theme-button-color)_10%,transparent)] rounded-xl border border-[color-mix(in_srgb,var(--tg-theme-button-color)_30%,transparent)]">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <FileIcon filename={props.oldFile.name} />
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-[15px] font-semibold text-[var(--tg-theme-text-color)] truncate">
                          {props.oldFile.name}
                        </span>
                        <span className="text-[13px] text-[var(--tg-theme-hint-color)]">
                          {formatFileSize(props.oldFile.size)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        tgHaptic("light");
                        props.setOldFile(null);
                      }}
                      className="w-8 h-8 flex items-center justify-center text-[var(--tg-theme-hint-color)] bg-[var(--tg-theme-bg-color)] rounded-full shadow-sm active:scale-95 transition-transform cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* Новая версия */}
              <div className="bg-[var(--tg-theme-bg-color)] p-4 rounded-2xl shadow-sm">
                <label className="text-[13px] font-bold text-[var(--tg-theme-hint-color)] uppercase tracking-wider block mb-3">
                  Новая редакция
                </label>
                {!props.newFile ? (
                  <DropzoneArea
                    id="new-file"
                    onFileSelect={(file) =>
                      handleFileSelect(file, props.setNewFile)
                    }
                  />
                ) : (
                  <div className="flex items-center justify-between p-3 bg-[color-mix(in_srgb,var(--tg-theme-button-color)_10%,transparent)] rounded-xl border border-[color-mix(in_srgb,var(--tg-theme-button-color)_30%,transparent)]">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <FileIcon filename={props.newFile.name} />
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-[15px] font-semibold text-[var(--tg-theme-text-color)] truncate">
                          {props.newFile.name}
                        </span>
                        <span className="text-[13px] text-[var(--tg-theme-hint-color)]">
                          {formatFileSize(props.newFile.size)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        tgHaptic("light");
                        props.setNewFile(null);
                      }}
                      className="w-8 h-8 flex items-center justify-center text-[var(--tg-theme-hint-color)] bg-[var(--tg-theme-bg-color)] rounded-full shadow-sm active:scale-95 transition-transform cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  tgHaptic("medium");
                  props.setIsCompareModalOpen(false);
                }}
                disabled={!props.oldFile || !props.newFile}
                className="w-full bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color,white)] font-semibold text-[17px] py-4 rounded-xl mt-4 disabled:opacity-50 active:scale-[0.98] transition-all cursor-pointer"
              >
                Готово
              </button>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* 5. Лимит файлов */}
      <Drawer.Root
        open={props.isFileLimitModalOpen}
        onOpenChange={(open) => {
          if (open) tgHapticNotification("warning");
          props.setIsFileLimitModalOpen(open);
        }}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
          <Drawer.Content
            className="bg-[var(--tg-theme-bg-color)] flex flex-col rounded-t-[24px] mt-24 fixed bottom-0 left-0 right-0 z-[60] outline-none"
            style={{ paddingBottom: "var(--safe-bottom)" }}
          >
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-[var(--tg-theme-hint-color)] opacity-20 mt-4 mb-2" />
            <div className="p-5 pb-10">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-16 h-16 bg-[#FFF4E5] rounded-full flex items-center justify-center mb-4">
                  <AlertTriangle size={28} className="text-[#FF9500]" />
                </div>
                <Drawer.Title className="text-[20px] font-bold text-[var(--tg-theme-text-color)] mb-2">
                  Лимит документов
                </Drawer.Title>
                <Drawer.Description className="text-[15px] text-[var(--tg-theme-hint-color)] leading-snug">
                  В этом чате уже загружены документы. Для новой проверки
                  создайте новый чат.
                </Drawer.Description>
              </div>
              <button
                type="button"
                onClick={() => {
                  tgHaptic("medium");
                  props.setIsFileLimitModalOpen(false);
                  navigate("/chat/new", { state: { openCompareModal: true } });
                }}
                className="w-full py-4 bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color,white)] rounded-xl text-[17px] font-semibold active:scale-[0.98] transition-all cursor-pointer"
              >
                Создать новый чат
              </button>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  );
};
