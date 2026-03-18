// src/features/chat/components/MessageBubble.tsx
import React, { useState } from "react";
import { AILoader, TypingLoader } from "./AILoader";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Drawer } from "vaul"; // Импортируем модалки
import {
  CheckCheck,
  Copy,
  Check,
  AlertTriangle,
  Info,
  CheckCircle,
  Download,
  TableProperties,
  Waypoints,
  X,
} from "lucide-react";
import { StackedFiles } from "./StackedFiles";
import { tgHapticNotification, tgHaptic } from "../../../utils/telegram";

interface MessageBubbleProps {
  msg: any;
  copiedMessageId: number | string | null;
  onCopy: (text: string, id: number | string) => void;
  onDownloadClick: () => void;
  onExportDocx?: () => void;
  isScanning?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  msg,
  copiedMessageId,
  onCopy,
  onDownloadClick,
  onExportDocx,
  isScanning,
}) => {
  const isUser = msg.role === "user";
  const timeString = new Date(msg.created_at).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Состояния для новых модалок
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);

  const rawText = msg.text || msg.content || "";
  const showFooter = isUser || msg.isComplete;

  let parsedData = null;
  let isComplexAnalysis = false;

  if (!isUser && rawText.trim().startsWith("{")) {
    try {
      parsedData = JSON.parse(rawText);
      if (parsedData.analysis || parsedData.diff_blocks) {
        isComplexAnalysis = true;
      }
    } catch (e) {}
  }

  const isStillStreamingJson =
    !isUser && !msg.isComplete && rawText.trim() === "{";
  const isTypingText = !isUser && !msg.isComplete && rawText.trim() === "...";

  const fileMatch = rawText.match(
    /Прикреплены документы для сравнения:\s*1\.\s*(.*?)\s*2\.\s*([^\n]+)/,
  );
  const isFileStack = isUser && fileMatch;

  let remainingText = "";
  if (isFileStack) {
    remainingText = rawText
      .replace(fileMatch[0], "")
      .replace(/^\n+/, "")
      .trim();
  }

  const handleExportClick = () => {
    tgHapticNotification("success");
    if (onExportDocx) onExportDocx();
  };

  const renderRiskBadge = (risk: string) => {
    switch (risk) {
      case "RED":
        return (
          <span className="flex items-center gap-1 bg-[#FF3B30]/15 text-[#FF3B30] px-2.5 py-1 rounded-md text-[11px] font-bold border border-[#FF3B30]/20 tracking-wide">
            <AlertTriangle size={13} strokeWidth={2.5} /> ВЫСОКИЙ РИСК
          </span>
        );
      case "YELLOW":
        return (
          <span className="flex items-center gap-1 bg-[#FF9500]/15 text-[#FF9500] px-2.5 py-1 rounded-md text-[11px] font-bold border border-[#FF9500]/20 tracking-wide">
            <Info size={13} strokeWidth={2.5} /> ВНИМАНИЕ
          </span>
        );
      case "GREEN":
      default:
        return (
          <span className="flex items-center gap-1 bg-[#34C759]/15 text-[#34C759] px-2.5 py-1 rounded-md text-[11px] font-bold border border-[#34C759]/20 tracking-wide">
            <CheckCircle size={13} strokeWidth={2.5} /> БЕЗОПАСНО
          </span>
        );
    }
  };

  const spaceForTimeClass = isUser
    ? "last:after:content-[''] last:after:inline-block last:after:w-[54px] last:after:h-[10px]"
    : "last:after:content-[''] last:after:inline-block last:after:w-[68px] last:after:h-[10px]";

  return (
    <>
      <div
        className={`flex w-full min-w-0 ${isUser ? "justify-end" : "justify-start"} mb-3 relative z-20 animate-in fade-in slide-in-from-bottom-2 duration-300`}
      >
        <div
          className={`relative flex items-end min-w-0 ${isUser ? "ml-auto" : "mr-auto"} ${!isFileStack && !isComplexAnalysis ? "max-w-[85%] sm:max-w-[75%]" : "max-w-[95%]"}`}
        >
          {!isUser && !isFileStack && (
            <svg
              viewBox="0 0 8 13"
              width="8"
              height="13"
              className="absolute -left-[7px] bottom-0 shrink-0 text-[var(--tg-theme-secondary-bg-color)]"
            >
              <path d="M8 0v13H0c3.9 0 8-4.2 8-13z" fill="currentColor" />
            </svg>
          )}

          {isFileStack ? (
            <div className="flex flex-col items-end">
              <StackedFiles
                file1={fileMatch[1]}
                file2={fileMatch[2]}
                onClick={onDownloadClick}
                isScanning={isScanning}
              />
              {remainingText && (
                <div className="mt-2 relative px-3 pt-2 pb-2 text-[16px] leading-snug shadow-sm flex flex-col z-10 w-full min-w-0 break-words bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)] rounded-[18px] rounded-br-none">
                  <ReactMarkdown>{remainingText}</ReactMarkdown>
                  <div className="absolute bottom-[6px] right-[10px] flex items-center gap-[3px] text-[11px] font-medium text-[var(--tg-theme-button-text-color)]/80">
                    <span>{timeString}</span>
                    <CheckCheck
                      size={14}
                      className="text-[var(--tg-theme-button-text-color)]"
                    />
                  </div>
                  <svg
                    viewBox="0 0 8 13"
                    width="8"
                    height="13"
                    className="absolute -right-[7px] bottom-0 shrink-0 text-[var(--tg-theme-button-color)]"
                  >
                    <path
                      d="M0 0v13h8c-3.9 0-8-4.2-8-13z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
              )}
            </div>
          ) : (
            <div
              className={`relative px-4 pt-3 pb-3 text-[15px] leading-snug shadow-sm flex flex-col z-10 w-full min-w-0 break-words ${isUser ? "bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)] rounded-[18px] rounded-br-none" : "bg-[var(--tg-theme-secondary-bg-color)] text-[var(--tg-theme-text-color)] rounded-[18px] rounded-bl-none"}`}
            >
              <div className="w-full min-w-0">
                {isStillStreamingJson ? (
                  <AILoader />
                ) : isTypingText ? (
                  <TypingLoader />
                ) : isComplexAnalysis && parsedData ? (
                  <div className="flex flex-col gap-4 pb-4">
                    {/* КАРТОЧКА: Результат аудита (Оставляем как есть) */}
                    <div className="bg-[var(--tg-theme-bg-color)] rounded-xl p-3 shadow-sm border border-[var(--tg-theme-secondary-bg-color)]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-[14px] uppercase tracking-wide text-[var(--tg-theme-hint-color)]">
                          Результат аудита
                        </span>
                        {parsedData.analysis?.overall_risk &&
                          renderRiskBadge(parsedData.analysis.overall_risk)}
                      </div>
                      <p className="text-[14px] font-medium text-[var(--tg-theme-text-color)]">
                        {parsedData.analysis?.summary}
                      </p>
                    </div>

                    {/* КАРТОЧКИ РИСКОВ (Оставляем как есть) */}
                    {parsedData.analysis?.details?.length > 0 && (
                      <div className="flex flex-col gap-2">
                        <span className="font-bold text-[13px] uppercase text-[var(--tg-theme-hint-color)] tracking-wider ml-1">
                          Детализация рисков:
                        </span>
                        {parsedData.analysis.details.map(
                          (detail: any, idx: number) => (
                            <div
                              key={idx}
                              className="bg-[var(--tg-theme-bg-color)] rounded-xl p-3 shadow-sm border border-[var(--tg-theme-secondary-bg-color)] flex flex-col gap-1.5"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className="font-bold text-[14px] leading-tight text-[var(--tg-theme-text-color)]">
                                  {detail.title}
                                </span>
                                <div className="shrink-0 mt-0.5">
                                  {renderRiskBadge(detail.risk)}
                                </div>
                              </div>
                              <p className="text-[13px] text-[var(--tg-theme-text-color)]/80">
                                {detail.explanation}
                              </p>
                              {detail.violated_law &&
                                detail.violated_law !== "null" && (
                                  <span className="text-[11px] font-semibold text-[var(--tg-theme-button-color)] bg-[var(--tg-theme-button-color)]/10 px-2 py-1 rounded inline-block w-fit mt-1 border border-[var(--tg-theme-button-color)]/20">
                                    Статья: {detail.violated_law}
                                  </span>
                                )}
                            </div>
                          ),
                        )}
                      </div>
                    )}

                    {/* НОВЫЙ БЛОК: 3 КНОПКИ ДЕЙСТВИЙ (Вместо открытого списка фрагментов) */}
                    <div className="flex flex-col gap-2 mt-2">
                      <div className="grid grid-cols-2 gap-2">
                        {/* Кнопка 1: Дорожка изменений (Модалка) */}
                        <button
                          onClick={() => {
                            tgHaptic("light");
                            setIsDiffModalOpen(true);
                          }}
                          className="flex flex-col items-center justify-center gap-1.5 bg-[var(--tg-theme-bg-color)] border border-[var(--tg-theme-section-separator-color,rgba(128,128,128,0.2))] rounded-xl p-3 shadow-sm active:scale-95 transition-transform"
                        >
                          <Waypoints
                            size={20}
                            className="text-[var(--tg-theme-button-color)]"
                          />
                          <span className="text-[12px] font-semibold text-[var(--tg-theme-text-color)] text-center leading-tight">
                            Дорожка
                            <br />
                            изменений
                          </span>
                        </button>

                        {/* Кнопка 2: Таблица (Модалка) */}
                        <button
                          onClick={() => {
                            tgHaptic("light");
                            setIsTableModalOpen(true);
                          }}
                          className="flex flex-col items-center justify-center gap-1.5 bg-[var(--tg-theme-bg-color)] border border-[var(--tg-theme-section-separator-color,rgba(128,128,128,0.2))] rounded-xl p-3 shadow-sm active:scale-95 transition-transform"
                        >
                          <TableProperties
                            size={20}
                            className="text-[var(--tg-theme-button-color)]"
                          />
                          <span className="text-[12px] font-semibold text-[var(--tg-theme-text-color)] text-center leading-tight">
                            Сводная
                            <br />
                            таблица
                          </span>
                        </button>
                      </div>

                      {/* Кнопка 3: Экспорт (Вызов функции) */}
                      <button
                        onClick={handleExportClick}
                        className="w-full mt-2 bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)] text-[13px] font-semibold py-3.5 px-4 rounded-xl shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-center leading-tight"
                      >
                        <Download size={18} className="shrink-0" />
                        Экспорт отчета в .docx с юр. комментариями и
                        гиперссылками на pravo.by
                      </button>
                    </div>
                  </div>
                ) : (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ node, ...props }) => (
                        <p
                          className={`mb-1 last:mb-0 whitespace-pre-wrap break-words inline-block w-full ${showFooter ? spaceForTimeClass : ""}`}
                          {...props}
                        />
                      ),
                      a: ({ node, ...props }) => (
                        <a
                          className={`${isUser ? "text-white underline" : "text-[var(--tg-theme-button-color)] underline"} break-all`}
                          {...props}
                        />
                      ),
                      strong: ({ node, ...props }) => (
                        <strong className="font-semibold" {...props} />
                      ),
                    }}
                  >
                    {rawText}
                  </ReactMarkdown>
                )}
              </div>

              {showFooter && (
                <div
                  className={`absolute bottom-[6px] right-[10px] flex items-center gap-[3px] text-[11px] font-medium select-none ${isUser ? "text-[var(--tg-theme-button-text-color)]/80" : "text-[var(--tg-theme-hint-color)]"}`}
                >
                  {!isUser &&
                    rawText &&
                    !isStillStreamingJson &&
                    !isTypingText && (
                      <button
                        type="button"
                        onClick={() => onCopy(rawText, msg.id)}
                        className="flex items-center hover:opacity-70 transition-colors cursor-pointer mr-0.5 text-[var(--tg-theme-hint-color)]"
                      >
                        {copiedMessageId === msg.id ? (
                          <Check
                            size={14}
                            className="text-[var(--tg-theme-button-color)]"
                          />
                        ) : (
                          <Copy size={13} />
                        )}
                      </button>
                    )}
                  <span>{timeString}</span>
                  {isUser && (
                    <CheckCheck
                      size={14}
                      className="text-[var(--tg-theme-button-text-color)]"
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {isUser && !isFileStack && (
            <svg
              viewBox="0 0 8 13"
              width="8"
              height="13"
              className="absolute -right-[7px] bottom-0 shrink-0 text-[var(--tg-theme-button-color)]"
            >
              <path d="M0 0v13h8c-3.9 0-8-4.2-8-13z" fill="currentColor" />
            </svg>
          )}
        </div>
      </div>

      {/* ============================================================
          МОДАЛКА 1: "Дорожка изменений" (Визуализация фрагментов) 
      ============================================================= */}
      <Drawer.Root open={isDiffModalOpen} onOpenChange={setIsDiffModalOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
          <Drawer.Content className="bg-[var(--tg-theme-secondary-bg-color)] flex flex-col rounded-t-[24px] mt-10 fixed bottom-0 left-0 right-0 z-[60] h-[85vh] outline-none">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-[var(--tg-theme-hint-color)] opacity-20 mt-4 mb-2" />

            <div className="px-5 pb-3 flex items-center justify-between border-b border-[var(--tg-theme-section-separator-color,rgba(128,128,128,0.2))]">
              <div>
                <Drawer.Title className="text-[18px] font-bold text-[var(--tg-theme-text-color)]">
                  Дорожка изменений
                </Drawer.Title>
                <p className="text-[12px] text-[var(--tg-theme-hint-color)] mt-0.5">
                  <span className="text-[#34C759] font-bold">Зеленый</span> —
                  безопасно,{" "}
                  <span className="text-[#FF9500] font-bold">Желтый</span> —
                  проверка,{" "}
                  <span className="text-[#FF3B30] font-bold">Красный</span> —
                  риск.
                </p>
              </div>
              <button
                onClick={() => setIsDiffModalOpen(false)}
                className="bg-[var(--tg-theme-bg-color)] p-2 rounded-full text-[var(--tg-theme-hint-color)]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {parsedData?.diff_blocks?.map((diff: any, idx: number) => {
                // Попытаемся найти оценку риска для этого блока, если она есть
                // Для демо подсветим рамку в зависимости от типа (тут можно улучшить логику маппинга с details)
                return (
                  <div
                    key={idx}
                    className="bg-[var(--tg-theme-bg-color)] rounded-xl overflow-hidden shadow-sm border border-[var(--tg-theme-section-separator-color,rgba(128,128,128,0.2))] flex flex-col"
                  >
                    <div className="bg-[color-mix(in_srgb,var(--tg-theme-button-color)_10%,transparent)] px-3 py-2 border-b border-[var(--tg-theme-section-separator-color,rgba(128,128,128,0.2))] flex items-center justify-between">
                      <span className="text-[12px] font-semibold text-[var(--tg-theme-button-color)]">
                        Фрагмент #{idx + 1}
                      </span>
                    </div>
                    <div
                      dangerouslySetInnerHTML={{ __html: diff.diff_html }}
                      className="p-3 text-[14px] font-serif leading-relaxed text-[var(--tg-theme-text-color)] overflow-x-auto 
                                 [&>del]:bg-[#FF3B30]/15 [&>del]:text-[#FF3B30] [&>del]:line-through [&>del]:px-1 [&>del]:rounded-sm 
                                 [&>ins]:bg-[#34C759]/15 [&>ins]:text-[#34C759] [&>ins]:no-underline [&>ins]:px-1 [&>ins]:rounded-sm"
                    />
                  </div>
                );
              })}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* ============================================================
          МОДАЛКА 2: "Сводная таблица" (Было/Стало/Статья/Риск/Рекомендация) 
      ============================================================= */}
      <Drawer.Root open={isTableModalOpen} onOpenChange={setIsTableModalOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
          <Drawer.Content className="bg-[var(--tg-theme-bg-color)] flex flex-col rounded-t-[24px] mt-10 fixed bottom-0 left-0 right-0 z-[60] h-[90vh] outline-none">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-[var(--tg-theme-hint-color)] opacity-20 mt-4 mb-2" />

            <div className="px-5 pb-3 flex items-center justify-between border-b border-[var(--tg-theme-section-separator-color,rgba(128,128,128,0.2))]">
              <Drawer.Title className="text-[18px] font-bold text-[var(--tg-theme-text-color)]">
                Автоматическая таблица рисков
              </Drawer.Title>
              <button
                onClick={() => setIsTableModalOpen(false)}
                className="bg-[var(--tg-theme-secondary-bg-color)] p-2 rounded-full text-[var(--tg-theme-hint-color)]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-[var(--tg-theme-secondary-bg-color)] text-[12px] uppercase text-[var(--tg-theme-hint-color)]">
                    <th className="p-3 rounded-tl-xl font-semibold">Было</th>
                    <th className="p-3 font-semibold">Стало</th>
                    <th className="p-3 font-semibold">Уровень риска</th>
                    <th className="p-3 font-semibold">Статья закона</th>
                    <th className="p-3 rounded-tr-xl font-semibold">
                      Рекомендация
                    </th>
                  </tr>
                </thead>
                <tbody className="text-[13px] text-[var(--tg-theme-text-color)] align-top">
                  {parsedData?.diff_blocks?.map((diff: any, idx: number) => {
                    // Ищем соответствующий этому блоку анализ (если бэкенд отдает)
                    // Для надежности берем деталь по индексу, либо ставим заглушку
                    const detail = parsedData.analysis?.details?.[idx] || null;

                    return (
                      <tr
                        key={idx}
                        className="border-b border-[var(--tg-theme-section-separator-color,rgba(128,128,128,0.2))]"
                      >
                        <td className="p-3 min-w-[150px] bg-[#FF3B30]/5 text-[#FF3B30]">
                          {diff.old_block?.text || "—"}
                        </td>
                        <td className="p-3 min-w-[150px] bg-[#34C759]/5 text-[#34C759]">
                          {diff.new_block?.text || "—"}
                        </td>
                        <td className="p-3">
                          {detail
                            ? renderRiskBadge(detail.risk)
                            : renderRiskBadge(
                                diff.change_type === "ADDED"
                                  ? "YELLOW"
                                  : "GREEN",
                              )}
                        </td>
                        <td className="p-3 text-[var(--tg-theme-button-color)] underline cursor-pointer">
                          {detail?.violated_law &&
                          detail.violated_law !== "null"
                            ? detail.violated_law
                            : "—"}
                        </td>
                        <td className="p-3 text-[12px] min-w-[150px]">
                          {detail?.explanation ||
                            "Изменение носит технический характер. Правки не требуются."}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  );
};
