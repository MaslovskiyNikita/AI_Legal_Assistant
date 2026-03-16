// src/features/settings/components/SettingsHistory.tsx
import React from "react";
import { useNavigate } from "react-router";
import {
  Clock,
  CalendarDays,
  CalendarRange,
  Layers,
  MessageSquare,
  ChevronRight,
  FileText,
  Download,
  Loader2,
} from "lucide-react";

interface SettingsHistoryProps {
  activeTab: "chats" | "documents";
  filterPeriod: string;
  setFilterPeriod: (val: any) => void;
  customStartDate: string;
  setCustomStartDate: (val: string) => void;
  customEndDate: string;
  setCustomEndDate: (val: string) => void;
  isLoadingStats: boolean;
  displayedChats: any[];
  displayedDocuments: any[];
  allFilteredChatsCount: number;
  allFilteredDocsCount: number;
  showAllChats: boolean;
  setShowAllChats: (val: boolean) => void;
  showAllDocuments: boolean;
  setShowAllDocuments: (val: boolean) => void;
  downloadingDocId: number | null;
  handleDownload: (
    e: React.MouseEvent,
    docId: number,
    filename: string,
  ) => void;
}

const filters = [
  { id: "all", label: "Все", icon: Layers },
  { id: "today", label: "Сегодня", icon: Clock },
  { id: "week", label: "Неделя", icon: CalendarDays },
  { id: "custom", label: "Период", icon: CalendarRange },
];

export const SettingsHistory: React.FC<SettingsHistoryProps> = (props) => {
  const navigate = useNavigate();

  return (
    <section className="pt-2 animate-in fade-in duration-300 shrink-0">
      <div className="flex items-center justify-between mb-3 px-4">
        <h3 className="text-[13px] font-medium text-[#8E8E93] uppercase tracking-wider ml-1">
          {props.activeTab === "chats"
            ? "История запросов"
            : "Сохраненные файлы"}
        </h3>
      </div>

      <div className="grid grid-cols-4 gap-2 px-4 mb-4">
        {filters.map((filter) => {
          const isSelected = props.filterPeriod === filter.id;
          const Icon = filter.icon;
          return (
            <button
              key={filter.id}
              onClick={() => {
                props.setFilterPeriod(filter.id);
                props.setShowAllChats(false);
                props.setShowAllDocuments(false);
              }}
              className={`flex flex-col items-center justify-center h-[70px] rounded-2xl border transition-all cursor-pointer ${isSelected ? "bg-[#3390EC] border-[#3390EC] text-white shadow-sm shadow-blue-500/20" : "bg-white border-[#E5E5EA] text-[#8E8E93] active:bg-[#F2F2F7]"}`}
            >
              <Icon
                size={20}
                className={`mb-1.5 ${isSelected ? "text-white" : "text-black"}`}
              />
              <span
                className={`text-[10px] uppercase font-bold tracking-wider ${isSelected ? "text-white/90" : "text-[#8E8E93]"}`}
              >
                {filter.label}
              </span>
            </button>
          );
        })}
      </div>

      {props.filterPeriod === "custom" && (
        <div className="mx-4 mb-4 flex items-center gap-2 animate-in slide-in-from-top-2 fade-in duration-200">
          <input
            type="date"
            value={props.customStartDate}
            onChange={(e) => props.setCustomStartDate(e.target.value)}
            className="flex-1 h-10 bg-white border border-[#E5E5EA] rounded-xl px-3 text-[14px] text-black outline-none focus:border-[#3390EC] transition-colors appearance-none"
          />
          <span className="text-[#8E8E93] font-medium">—</span>
          <input
            type="date"
            value={props.customEndDate}
            onChange={(e) => props.setCustomEndDate(e.target.value)}
            className="flex-1 h-10 bg-white border border-[#E5E5EA] rounded-xl px-3 text-[14px] text-black outline-none focus:border-[#3390EC] transition-colors appearance-none"
          />
        </div>
      )}

      <div className="mx-4 bg-white rounded-2xl border border-[#E5E5EA] overflow-hidden flex flex-col min-h-[120px] shadow-sm">
        {props.isLoadingStats ? (
          <div className="flex-1 flex items-center justify-center py-8">
            <Loader2 size={24} className="animate-spin text-[#8E8E93]" />
          </div>
        ) : props.activeTab === "chats" ? (
          props.allFilteredChatsCount === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-8 text-center px-4">
              <Clock size={32} className="text-[#C7C7CC] mb-3" />
              <p className="text-[#8E8E93] text-[15px]">Нет консультаций</p>
            </div>
          ) : (
            <>
              {props.displayedChats.map((chat: any, idx) => {
                const displayDate = chat.created_at
                  ? new Date(chat.created_at).toLocaleDateString("ru-RU", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "";
                return (
                  <button
                    key={chat.id}
                    onClick={() => navigate(`/chat/${chat.id}`)}
                    className={`w-full flex items-center justify-between px-4 py-3.5 bg-white active:bg-[#F2F2F7] transition-colors cursor-pointer text-left ${idx !== props.displayedChats.length - 1 ? "border-b border-[#E5E5EA]" : ""}`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden pr-4">
                      <div className="w-9 h-9 rounded-full bg-[#F0F8FF] flex items-center justify-center shrink-0">
                        <MessageSquare size={16} className="text-[#3390EC]" />
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="font-semibold text-[15px] text-black truncate">
                          {chat.title || "Новая консультация"}
                        </span>
                        <span className="text-[13px] text-[#8E8E93] mt-0.5">
                          {displayDate}
                        </span>
                      </div>
                    </div>
                    <ChevronRight
                      size={18}
                      className="text-[#C7C7CC] shrink-0"
                    />
                  </button>
                );
              })}
              {props.allFilteredChatsCount > 5 && (
                <button
                  onClick={() => props.setShowAllChats(!props.showAllChats)}
                  className="w-full py-3.5 text-[15px] font-medium text-[#3390EC] bg-white active:bg-[#F2F2F7] transition-colors cursor-pointer border-t border-[#E5E5EA]"
                >
                  {props.showAllChats
                    ? "Скрыть"
                    : `Показать все (${props.allFilteredChatsCount})`}
                </button>
              )}
            </>
          )
        ) : props.allFilteredDocsCount === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-8 text-center px-4">
            <FileText size={32} className="text-[#C7C7CC] mb-3" />
            <p className="text-[#8E8E93] text-[15px]">Нет документов</p>
          </div>
        ) : (
          <>
            {props.displayedDocuments.map((doc: any, idx) => {
              const isDownloading = props.downloadingDocId === doc.id;
              const docDateStr =
                doc.created_at ||
                doc.createdAt ||
                doc.updated_at ||
                doc.chatDate;
              const displayDate = docDateStr
                ? new Date(docDateStr).toLocaleDateString("ru-RU", {
                    day: "numeric",
                    month: "short",
                  })
                : "Документ из чата";
              return (
                <div
                  key={doc.id}
                  onClick={() => navigate(`/chat/${doc.chatId}`)}
                  className={`w-full flex items-center justify-between px-4 py-3.5 bg-white hover:bg-[#F9FAFB] active:bg-[#F2F2F7] transition-colors cursor-pointer text-left ${idx !== props.displayedDocuments.length - 1 ? "border-b border-[#E5E5EA]" : ""}`}
                >
                  <div className="flex items-center gap-3 overflow-hidden pr-2">
                    <div className="w-10 h-10 rounded-lg bg-[#F0F8FF] border border-[#E5E5EA] flex items-center justify-center shrink-0">
                      <FileText size={18} className="text-[#3390EC]" />
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="font-semibold text-[15px] text-black truncate">
                        {doc.filename || `Документ #${doc.id}`}
                      </span>
                      <span className="text-[12px] text-[#8E8E93] mt-0.5 truncate">
                        {displayDate} • {doc.chatTitle || "Консультация"}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) =>
                      props.handleDownload(
                        e,
                        doc.id,
                        doc.filename || "document.pdf",
                      )
                    }
                    disabled={isDownloading}
                    className="w-9 h-9 shrink-0 rounded-full bg-[#F2F2F7] flex items-center justify-center text-[#3390EC] hover:bg-[#E5E5EA] active:scale-95 transition-all"
                  >
                    {isDownloading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Download size={16} />
                    )}
                  </button>
                </div>
              );
            })}
            {props.allFilteredDocsCount > 5 && (
              <button
                onClick={() =>
                  props.setShowAllDocuments(!props.showAllDocuments)
                }
                className="w-full py-3.5 text-[15px] font-medium text-[#3390EC] bg-white active:bg-[#F2F2F7] transition-colors cursor-pointer border-t border-[#E5E5EA]"
              >
                {props.showAllDocuments
                  ? "Скрыть"
                  : `Показать все (${props.allFilteredDocsCount})`}
              </button>
            )}
          </>
        )}
      </div>
    </section>
  );
};
