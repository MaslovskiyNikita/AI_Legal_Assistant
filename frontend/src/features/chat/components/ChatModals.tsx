// src/features/chat/components/ChatModals.tsx
import React from "react";
import { X, Download, Share2, UploadCloud } from "lucide-react";
import { useNavigate } from "react-router";
import { FileIcon } from "../../../components/ui/FileIcon";
import { apiClient } from "../../../api/client";
import { formatFileSize } from "../../../utils/fileUtils";
import { useToast } from "../../../hooks/useToast"; // <-- Импортировали хук уведомлений

interface ChatModalsProps {
  // Delete
  isDeleteModalOpen: boolean;
  setIsDeleteModalOpen: (val: boolean) => void;
  executeDeleteChat: () => void;

  // Download
  isDownloadModalOpen: boolean;
  setIsDownloadModalOpen: (val: boolean) => void;
  chatDocuments: any[];

  // Export
  isExportModalOpen: boolean;
  setIsExportModalOpen: (val: boolean) => void;
  isExporting: boolean;
  handleExport: (format: "docx" | "pdf") => void;

  // Compare
  isCompareModalOpen: boolean;
  setIsCompareModalOpen: (val: boolean) => void;
  oldFile: File | null;
  setOldFile: (file: File | null) => void;
  newFile: File | null;
  setNewFile: (file: File | null) => void;

  // Limit
  isFileLimitModalOpen: boolean;
  setIsFileLimitModalOpen: (val: boolean) => void;
}

export const ChatModals: React.FC<ChatModalsProps> = (props) => {
  const navigate = useNavigate();
  const { showToast } = useToast(); // <-- Достали функцию показа уведомлений

  // Функция валидации файлов
  const handleFileSelect = (
    file: File | null,
    setFile: (f: File | null) => void,
  ) => {
    if (!file) return;

    // Проверка размера (10 МБ)
    if (file.size > 10 * 1024 * 1024) {
      showToast("Файл слишком большой. Максимум 10 МБ.", "error");
      return;
    }

    // Проверка формата
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

    setFile(file);
  };

  return (
    <>
      {/* Модалка удаления */}
      {props.isDeleteModalOpen && (
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
                onClick={props.executeDeleteChat}
                className="w-full py-3.5 text-[17px] font-normal text-[#FF3B30] border-b border-[#E5E5EA] active:bg-[#F2F2F7] transition-colors"
              >
                Удалить
              </button>
              <button
                onClick={() => props.setIsDeleteModalOpen(false)}
                className="w-full py-3.5 text-[17px] font-semibold text-[#3390EC] active:bg-[#F2F2F7] transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модалка скачивания документов */}
      {props.isDownloadModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center mb-4 shrink-0">
              <h2 className="text-[17px] font-semibold text-black">
                Документы чата
              </h2>
              <button
                onClick={() => props.setIsDownloadModalOpen(false)}
                className="text-[#8E8E93] hover:text-black transition-colors bg-[#F2F2F7] rounded-full p-1"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {props.chatDocuments.length === 0 ? (
                <div className="text-center py-8 text-[#8E8E93] text-[15px]">
                  Нет прикрепленных документов
                </div>
              ) : (
                props.chatDocuments.map((doc, idx) => (
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

      {/* Модалка экспорта */}
      {props.isExportModalOpen && (
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
                onClick={() => props.handleExport("docx")}
                disabled={props.isExporting}
                className="w-full py-3.5 text-[17px] font-normal text-black border-b border-[#E5E5EA] active:bg-[#F2F2F7] transition-colors"
              >
                {props.isExporting ? "Экспорт..." : "Скачать в .DOCX"}
              </button>
              <button
                onClick={() => props.handleExport("pdf")}
                disabled={props.isExporting}
                className="w-full py-3.5 text-[17px] font-normal text-black border-b border-[#E5E5EA] active:bg-[#F2F2F7] transition-colors"
              >
                {props.isExporting ? "Экспорт..." : "Скачать в .PDF"}
              </button>
              <button
                onClick={() => props.setIsExportModalOpen(false)}
                disabled={props.isExporting}
                className="w-full py-3.5 text-[17px] font-semibold text-[#FF3B30] active:bg-[#F2F2F7] transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модалка прикрепления файлов */}
      {props.isCompareModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-[#E5E5EA]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[17px] font-semibold text-black">
                Прикрепить файлы
              </h2>
              <button
                onClick={() => props.setIsCompareModalOpen(false)}
                className="text-[#8E8E93] hover:text-black bg-[#F2F2F7] rounded-full p-1 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              {/* Старая версия */}
              <div>
                <label className="text-[13px] font-medium text-[#8E8E93] uppercase tracking-wider block mb-2">
                  Старая версия
                </label>
                {!props.oldFile ? (
                  <label
                    htmlFor="old-file"
                    className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-[#E5E5EA] rounded-xl bg-[#F9FAFB] hover:bg-[#F2F2F7] transition-colors cursor-pointer"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <UploadCloud size={24} className="text-[#8E8E93] mb-2" />
                      <p className="text-sm text-[#8E8E93] font-medium">
                        Нажмите для загрузки
                      </p>
                    </div>
                    <input
                      id="old-file"
                      type="file"
                      className="hidden"
                      onChange={(e) =>
                        handleFileSelect(
                          e.target.files?.[0] || null,
                          props.setOldFile,
                        )
                      } // <-- Используем валидацию
                      accept=".pdf,.doc,.docx"
                    />
                  </label>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-[#F0F8FF] border border-[#3390EC]/30 rounded-xl">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <FileIcon filename={props.oldFile.name} />
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-[14px] font-medium text-black truncate">
                          {props.oldFile.name}
                        </span>
                        <span className="text-[12px] text-[#8E8E93]">
                          {formatFileSize(props.oldFile.size)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => props.setOldFile(null)}
                      className="p-1.5 text-[#8E8E93] hover:text-[#FF3B30] transition-colors rounded-full bg-white shadow-sm"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>

              <div className="h-[1px] bg-[#E5E5EA]" />

              {/* Новая версия */}
              <div>
                <label className="text-[13px] font-medium text-[#8E8E93] uppercase tracking-wider block mb-2">
                  Новая версия
                </label>
                {!props.newFile ? (
                  <label
                    htmlFor="new-file"
                    className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-[#E5E5EA] rounded-xl bg-[#F9FAFB] hover:bg-[#F2F2F7] transition-colors cursor-pointer"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <UploadCloud size={24} className="text-[#8E8E93] mb-2" />
                      <p className="text-sm text-[#8E8E93] font-medium">
                        Нажмите для загрузки
                      </p>
                    </div>
                    <input
                      id="new-file"
                      type="file"
                      className="hidden"
                      onChange={(e) =>
                        handleFileSelect(
                          e.target.files?.[0] || null,
                          props.setNewFile,
                        )
                      } // <-- Используем валидацию
                      accept=".pdf,.doc,.docx"
                    />
                  </label>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-[#F0F8FF] border border-[#3390EC]/30 rounded-xl">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <FileIcon filename={props.newFile.name} />
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-[14px] font-medium text-black truncate">
                          {props.newFile.name}
                        </span>
                        <span className="text-[12px] text-[#8E8E93]">
                          {formatFileSize(props.newFile.size)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => props.setNewFile(null)}
                      className="p-1.5 text-[#8E8E93] hover:text-[#FF3B30] transition-colors rounded-full bg-white shadow-sm"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => props.setIsCompareModalOpen(false)}
              disabled={!props.oldFile || !props.newFile}
              className="w-full bg-[#3390EC] text-white font-semibold text-[16px] py-3.5 rounded-xl mt-6 disabled:opacity-50 active:bg-blue-600 transition-colors shadow-sm shadow-blue-500/30 flex items-center justify-center gap-2"
            >
              Сохранить выбор
            </button>
          </div>
        </div>
      )}

      {/* Модалка лимита файлов */}
      {props.isFileLimitModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-[#E5E5EA]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-[17px] font-semibold text-black">
                Лимит документов
              </h2>
              <button
                onClick={() => props.setIsFileLimitModalOpen(false)}
                className="text-[#8E8E93] hover:text-black bg-[#F2F2F7] rounded-full p-1 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-[14px] text-[#8E8E93] leading-snug mb-6">
              В этом чате уже прикреплены документы. Для сравнения новых файлов,
              пожалуйста, создайте новый чат.
            </p>
            <button
              onClick={() => {
                props.setIsFileLimitModalOpen(false);
                navigate("/chat/new", { state: { openCompareModal: true } });
              }}
              className="w-full bg-[#3390EC] text-white font-semibold text-[16px] py-3.5 rounded-xl active:bg-blue-600 transition-colors shadow-sm shadow-blue-500/30 flex items-center justify-center gap-2"
            >
              Создать новый чат
            </button>
          </div>
        </div>
      )}
    </>
  );
};
