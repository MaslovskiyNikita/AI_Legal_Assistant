// src/features/settings/components/SettingsHistory.tsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import {
  Clock,
  MessageSquare,
  ChevronRight,
  FileText,
  Download,
  Trash2,
  Loader2,
} from "lucide-react";
import {
  SwipeableList,
  SwipeableListItem,
  SwipeAction,
  TrailingActions,
} from "react-swipeable-list";
import "react-swipeable-list/dist/styles.css";

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
  onDeleteChat?: (chatId: number) => void;
  onDeleteDocument?: (docId: number) => void; // <-- Добавили проп
}

const filters = [
  { id: "all", label: "Все" },
  { id: "today", label: "Сегодня" },
  { id: "week", label: "Неделя" },
  { id: "custom", label: "Период" },
];

export const SettingsHistory: React.FC<SettingsHistoryProps> = (props) => {
  const navigate = useNavigate();

  // Стейт для анимации плавающего фона
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const index = filters.findIndex((f) => f.id === props.filterPeriod);
    setActiveIndex(index !== -1 ? index : 0);
  }, [props.filterPeriod]);

  // Функция для красной кнопки свайпа (Чаты)
  const trailingActionsChat = (chatId: number) => (
    <TrailingActions>
      <SwipeAction
        destructive={true}
        onClick={() => props.onDeleteChat && props.onDeleteChat(chatId)}
      >
        <div className="flex items-center justify-center w-20 bg-[#FF3B30] text-white h-full">
          <Trash2 size={20} />
        </div>
      </SwipeAction>
    </TrailingActions>
  );

  // Функция для красной кнопки свайпа (Документы)
  const trailingActionsDoc = (docId: number) => (
    <TrailingActions>
      <SwipeAction
        destructive={true}
        onClick={() => props.onDeleteDocument && props.onDeleteDocument(docId)}
      >
        <div className="flex items-center justify-center w-20 bg-[#FF3B30] text-white h-full">
          <Trash2 size={20} />
        </div>
      </SwipeAction>
    </TrailingActions>
  );

  return (
    <section className="pt-2 animate-in fade-in duration-300 shrink-0">
      <div className="flex items-center justify-between mb-3 px-4">
        <h3 className="text-[13px] font-medium text-[var(--tg-theme-hint-color)] uppercase tracking-wider ml-1">
          {props.activeTab === "chats"
            ? "История запросов"
            : "Сохраненные файлы"}
        </h3>
      </div>

      {/* 1. ПЛАВНЫЙ SEGMENTED CONTROL */}
      <div className="px-4 mb-4">
        <div
          ref={containerRef}
          className="flex items-center bg-[#E5E5EA] p-1 rounded-xl relative"
        >
          {/* Плавающий белый фон */}
          <div
            className="absolute top-1 bottom-1 bg-[var(--tg-theme-bg-color)] rounded-lg shadow-sm transition-transform duration-300 ease-out"
            style={{
              width: `calc(100% / ${filters.length} - 2px)`,
              transform: `translateX(calc(${activeIndex * 100}% + ${activeIndex * 2}px))`,
            }}
          />

          {/* Сами кнопки */}
          {filters.map((filter) => {
            const isSelected = props.filterPeriod === filter.id;
            return (
              <button
                type="button"
                key={filter.id}
                onClick={() => {
                  props.setFilterPeriod(filter.id);
                  props.setShowAllChats(false);
                  props.setShowAllDocuments(false);
                }}
                className={`flex-1 py-1.5 text-[13px] font-medium rounded-lg transition-colors duration-300 z-10 ${
                  isSelected
                    ? "text-[var(--tg-theme-text-color)]"
                    : "text-[var(--tg-theme-hint-color)] hover:text-[var(--tg-theme-text-color)]"
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ИНПУТЫ ДЛЯ КАСТОМНОГО ПЕРИОДА */}
      {props.filterPeriod === "custom" && (
        <div className="mx-4 mb-4 flex items-center gap-2 animate-in slide-in-from-top-2 fade-in duration-200">
          <input
            type="date"
            value={props.customStartDate}
            onChange={(e) => props.setCustomStartDate(e.target.value)}
            className="flex-1 h-10 bg-[var(--tg-theme-bg-color)] border border-[#E5E5EA] rounded-xl px-3 text-[14px] text-[var(--tg-theme-text-color)] outline-none focus:border-[#3390EC] transition-colors appearance-none"
          />
          <span className="text-[var(--tg-theme-hint-color)] font-medium">
            —
          </span>
          <input
            type="date"
            value={props.customEndDate}
            onChange={(e) => props.setCustomEndDate(e.target.value)}
            className="flex-1 h-10 bg-[var(--tg-theme-bg-color)] border border-[#E5E5EA] rounded-xl px-3 text-[14px] text-[var(--tg-theme-text-color)] outline-none focus:border-[#3390EC] transition-colors appearance-none"
          />
        </div>
      )}

      {/* КОНТЕЙНЕР СО СПИСКОМ */}
      <div className="mx-4 bg-[var(--tg-theme-bg-color)] rounded-2xl border border-[#E5E5EA] overflow-hidden flex flex-col min-h-[120px] shadow-sm">
        {props.isLoadingStats ? (
          <div className="w-full flex flex-col">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-full flex items-center justify-between px-4 py-3.5 border-b border-[#E5E5EA] last:border-0"
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="w-9 h-9 rounded-full bg-[var(--tg-theme-secondary-bg-color)] animate-pulse shrink-0"></div>
                  <div className="flex flex-col gap-2 w-full">
                    <div className="h-4 bg-[var(--tg-theme-secondary-bg-color)] rounded animate-pulse w-3/4"></div>
                    <div className="h-3 bg-[var(--tg-theme-secondary-bg-color)] rounded animate-pulse w-1/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : props.activeTab === "chats" ? (
          props.allFilteredChatsCount === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-8 text-center px-4">
              <Clock size={32} className="text-[#C7C7CC] mb-3" />
              <p className="text-[var(--tg-theme-hint-color)] text-[15px]">
                Нет консультаций
              </p>
            </div>
          ) : (
            <>
              <SwipeableList threshold={0.5}>
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
                    <SwipeableListItem
                      key={chat.id}
                      trailingActions={trailingActionsChat(chat.id)}
                      className={`w-full bg-[var(--tg-theme-bg-color)] ${idx !== props.displayedChats.length - 1 ? "border-b border-[#E5E5EA]" : ""}`}
                    >
                      <div
                        onClick={() => navigate(`/chat/${chat.id}`)}
                        className="w-full flex items-center justify-between px-4 py-3.5 active:bg-[var(--tg-theme-secondary-bg-color)] transition-colors cursor-pointer text-left"
                      >
                        <div className="flex items-center gap-3 overflow-hidden pr-4">
                          <div className="w-9 h-9 rounded-full bg-[#F0F8FF] flex items-center justify-center shrink-0">
                            <MessageSquare
                              size={16}
                              className="text-[var(--tg-theme-button-color)]"
                            />
                          </div>
                          <div className="flex flex-col overflow-hidden">
                            <span className="font-semibold text-[15px] text-[var(--tg-theme-text-color)] truncate">
                              {chat.title || "Новая консультация"}
                            </span>
                            <span className="text-[13px] text-[var(--tg-theme-hint-color)] mt-0.5">
                              {displayDate}
                            </span>
                          </div>
                        </div>
                        <ChevronRight
                          size={18}
                          className="text-[#C7C7CC] shrink-0"
                        />
                      </div>
                    </SwipeableListItem>
                  );
                })}
              </SwipeableList>

              {props.allFilteredChatsCount > 5 && (
                <button
                  type="button"
                  onClick={() => props.setShowAllChats(!props.showAllChats)}
                  className="w-full py-3.5 text-[15px] font-medium text-[var(--tg-theme-button-color)] bg-[var(--tg-theme-bg-color)] active:bg-[var(--tg-theme-secondary-bg-color)] transition-colors cursor-pointer border-t border-[#E5E5EA]"
                >
                  {props.showAllChats
                    ? "Скрыть"
                    : `Показать все (${props.allFilteredChatsCount})`}
                </button>
              )}
            </>
          )
        ) : // 2. НОВОЕ: Свайп для документов
        props.allFilteredDocsCount === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-8 text-center px-4">
            <FileText size={32} className="text-[#C7C7CC] mb-3" />
            <p className="text-[var(--tg-theme-hint-color)] text-[15px]">
              Нет документов
            </p>
          </div>
        ) : (
          <>
            <SwipeableList threshold={0.5}>
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
                  <SwipeableListItem
                    key={doc.id}
                    trailingActions={trailingActionsDoc(doc.id)}
                    className={`w-full bg-[var(--tg-theme-bg-color)] ${idx !== props.displayedDocuments.length - 1 ? "border-b border-[#E5E5EA]" : ""}`}
                  >
                    <div
                      onClick={() => navigate(`/chat/${doc.chatId}`)}
                      className="w-full flex items-center justify-between px-4 py-3.5 active:bg-[var(--tg-theme-secondary-bg-color)] transition-colors cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-3 overflow-hidden pr-2">
                        <div className="w-10 h-10 rounded-lg bg-[#F0F8FF] border border-[#E5E5EA] flex items-center justify-center shrink-0">
                          <FileText
                            size={18}
                            className="text-[var(--tg-theme-button-color)]"
                          />
                        </div>
                        <div className="flex flex-col overflow-hidden">
                          <span className="font-semibold text-[15px] text-[var(--tg-theme-text-color)] truncate">
                            {doc.filename || `Документ #${doc.id}`}
                          </span>
                          <span className="text-[12px] text-[var(--tg-theme-hint-color)] mt-0.5 truncate">
                            {displayDate} • {doc.chatTitle || "Консультация"}
                          </span>
                        </div>
                      </div>
                      {/* Кнопка скачивания (останавливаем всплытие клика, чтобы не переходить в чат) */}
                      <button
                        type="button"
                        onClick={(e) =>
                          props.handleDownload(
                            e,
                            doc.id,
                            doc.filename || "document.pdf",
                          )
                        }
                        disabled={isDownloading}
                        className="w-9 h-9 shrink-0 rounded-full bg-[var(--tg-theme-secondary-bg-color)] flex items-center justify-center text-[var(--tg-theme-button-color)] hover:bg-[#E5E5EA] active:scale-95 transition-all"
                      >
                        {isDownloading ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Download size={16} />
                        )}
                      </button>
                    </div>
                  </SwipeableListItem>
                );
              })}
            </SwipeableList>

            {props.allFilteredDocsCount > 5 && (
              <button
                type="button"
                onClick={() =>
                  props.setShowAllDocuments(!props.showAllDocuments)
                }
                className="w-full py-3.5 text-[15px] font-medium text-[var(--tg-theme-button-color)] bg-[var(--tg-theme-bg-color)] active:bg-[var(--tg-theme-secondary-bg-color)] transition-colors cursor-pointer border-t border-[#E5E5EA]"
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
