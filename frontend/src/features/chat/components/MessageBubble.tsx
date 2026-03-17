// src/features/chat/components/MessageBubble.tsx
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  CheckCheck,
  Copy,
  Check,
  AlertTriangle,
  Info,
  CheckCircle,
  ShieldAlert,
} from "lucide-react";
import { StackedFiles } from "./StackedFiles";

interface MessageBubbleProps {
  msg: any;
  copiedMessageId: number | string | null;
  onCopy: (text: string, id: number | string) => void;
  onDownloadClick: () => void;
  isScanning?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  msg,
  copiedMessageId,
  onCopy,
  onDownloadClick,
  isScanning,
}) => {
  const isUser = msg.role === "user";
  const timeString = new Date(msg.created_at).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Получаем сырой текст из сообщения
  const rawText = msg.text || msg.content || "";
  const showFooter = isUser || msg.isComplete;

  // --- МАГИЯ ПАРСИНГА ОТВЕТА БЭКЕНДА ---
  let parsedData = null;
  let isComplexAnalysis = false;

  // Пытаемся понять, прислал ли бэкенд сложный JSON с аудитом
  if (!isUser && rawText.trim().startsWith("{")) {
    try {
      parsedData = JSON.parse(rawText);
      if (parsedData.analysis || parsedData.diff_blocks) {
        isComplexAnalysis = true;
      }
    } catch (e) {
      // Если JSON парсится с ошибкой (например, он еще стримится)
      // Оставляем isComplexAnalysis = false
    }
  }

  // Если это сложный объект, но он еще загружается (стримится)
  const isStillStreamingJson =
    !isUser &&
    !msg.isComplete &&
    rawText.trim().startsWith("{") &&
    !isComplexAnalysis;

  // --- ОБРАБОТКА ПОЛЬЗОВАТЕЛЬСКОГО СООБЩЕНИЯ С ФАЙЛАМИ ---
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

  // --- РЕНДЕР КАРТОЧЕК РИСКА ---
  const renderRiskBadge = (risk: string) => {
    switch (risk) {
      case "RED":
        return (
          <span className="flex items-center gap-1 bg-red-100 text-red-700 px-2 py-0.5 rounded text-[11px] font-bold">
            <AlertTriangle size={12} /> ВЫСОКИЙ РИСК
          </span>
        );
      case "YELLOW":
        return (
          <span className="flex items-center gap-1 bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-[11px] font-bold">
            <Info size={12} /> ВНИМАНИЕ
          </span>
        );
      case "GREEN":
      default:
        return (
          <span className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-0.5 rounded text-[11px] font-bold">
            <CheckCircle size={12} /> БЕЗОПАСНО
          </span>
        );
    }
  };

  const spaceForTimeClass = isUser
    ? "last:after:content-[''] last:after:inline-block last:after:w-[54px] last:after:h-[10px]"
    : "last:after:content-[''] last:after:inline-block last:after:w-[68px] last:after:h-[10px]";

  return (
    <div
      className={`flex w-full min-w-0 ${isUser ? "justify-end" : "justify-start"} mb-3 relative z-20`}
    >
      <div
        className={`relative flex items-end min-w-0 ${isUser ? "ml-auto" : "mr-auto"} ${!isFileStack && !isComplexAnalysis ? "max-w-[85%] sm:max-w-[75%]" : "max-w-[95%]"}`}
      >
        {/* Хвостик пузыря для ИИ */}
        {!isUser && !isFileStack && (
          <svg
            viewBox="0 0 8 13"
            width="8"
            height="13"
            className="absolute -left-[7px] bottom-0 text-[#F2F2F7] fill-current shrink-0"
          >
            <path d="M8 0v13H0c3.9 0 8-4.2 8-13z" />
          </svg>
        )}

        {/* ЕСЛИ ЭТО ПОЛЬЗОВАТЕЛЬ ОТПРАВИЛ ФАЙЛЫ */}
        {isFileStack ? (
          <div className="flex flex-col items-end">
            <StackedFiles
              file1={fileMatch[1]}
              file2={fileMatch[2]}
              onClick={onDownloadClick}
              isScanning={isScanning}
            />
            {remainingText && (
              <div className="mt-2 relative px-3 pt-2 pb-2 text-[16px] leading-snug shadow-sm flex flex-col z-10 w-full min-w-0 break-words bg-[#3390EC] text-white rounded-[18px] rounded-br-none">
                <ReactMarkdown
                  components={{
                    p: ({ node, ...props }) => (
                      <p
                        className={`mb-1 last:mb-0 whitespace-pre-wrap break-words inline-block w-full ${spaceForTimeClass}`}
                        {...props}
                      />
                    ),
                  }}
                >
                  {remainingText}
                </ReactMarkdown>
                <div className="absolute bottom-[6px] right-[10px] flex items-center gap-[3px] text-[11px] font-medium text-blue-100">
                  <span>{timeString}</span>
                  <CheckCheck size={14} className="text-white" />
                </div>
                <svg
                  viewBox="0 0 8 13"
                  width="8"
                  height="13"
                  className="absolute -right-[7px] bottom-0 text-[#3390EC] fill-current shrink-0"
                >
                  <path d="M0 0v13h8c-3.9 0-8-4.2-8-13z" />
                </svg>
              </div>
            )}
          </div>
        ) : (
          <div
            className={`relative px-4 pt-3 pb-3 text-[15px] leading-snug shadow-sm flex flex-col z-10 w-full min-w-0 break-words ${isUser ? "bg-[#3390EC] text-white rounded-[18px] rounded-br-none" : "bg-[#F2F2F7] text-black rounded-[18px] rounded-bl-none"}`}
          >
            <div className="w-full min-w-0">
              {/* ЕСЛИ ИДЕТ ЗАГРУЗКА JSON */}
              {isStillStreamingJson ? (
                <div className="flex items-center gap-2 text-[#8E8E93] font-medium animate-pulse pb-2">
                  <ShieldAlert size={18} />
                  Анализирую документы и выявляю риски...
                </div>
              ) : /* ЕСЛИ БЭКЕНД ПРИСЛАЛ СЛОЖНЫЙ АУДИТ ФАЙЛОВ */
              isComplexAnalysis && parsedData ? (
                <div className="flex flex-col gap-4 pb-2">
                  {/* Заголовок аудита */}
                  <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-[14px] uppercase tracking-wide text-gray-500">
                        Результат аудита
                      </span>
                      {parsedData.analysis?.overall_risk &&
                        renderRiskBadge(parsedData.analysis.overall_risk)}
                    </div>
                    <p className="text-[14px] font-medium">
                      {parsedData.analysis?.summary}
                    </p>
                  </div>

                  {/* Список рисков */}
                  {parsedData.analysis?.details?.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <span className="font-bold text-[13px] uppercase text-gray-500 ml-1">
                        Детализация рисков:
                      </span>
                      {parsedData.analysis.details.map(
                        (detail: any, idx: number) => (
                          <div
                            key={idx}
                            className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex flex-col gap-1.5"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-bold text-[14px] leading-tight">
                                {detail.title}
                              </span>
                              <div className="shrink-0 mt-0.5">
                                {renderRiskBadge(detail.risk)}
                              </div>
                            </div>
                            <p className="text-[13px] text-gray-700">
                              {detail.explanation}
                            </p>
                            {detail.violated_law &&
                              detail.violated_law !== "null" && (
                                <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded inline-block w-fit mt-1">
                                  Нарушение: {detail.violated_law}
                                </span>
                              )}
                          </div>
                        ),
                      )}
                    </div>
                  )}

                  {/* Подсветка изменений в тексте (Diffs) */}
                  {parsedData.diff_blocks?.length > 0 && (
                    <div className="flex flex-col gap-2 mt-2">
                      <span className="font-bold text-[13px] uppercase text-gray-500 ml-1">
                        Измененные фрагменты:
                      </span>
                      {parsedData.diff_blocks.map((diff: any, idx: number) => (
                        <div
                          key={idx}
                          className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 text-[13px] font-mono leading-relaxed overflow-x-auto"
                        >
                          {/* Рендерим HTML с <ins> и <del> прямо от бэкенда */}
                          <div
                            dangerouslySetInnerHTML={{ __html: diff.diff_html }}
                            className="[&>del]:bg-red-100 [&>del]:text-red-800 [&>del]:line-through [&>ins]:bg-green-100 [&>ins]:text-green-800 [&>ins]:no-underline"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* ЕСЛИ БЭКЕНД ПРИСЛАЛ ОБЫЧНЫЙ ТЕКСТ (ОТВЕТ НА ВОПРОС) */
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
                        className={`${isUser ? "text-white underline" : "text-[#3390EC] underline"} break-all`}
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

            {/* Подвал сообщения (Время и галочки) */}
            {showFooter && (
              <div
                className={`absolute bottom-[6px] right-[10px] flex items-center gap-[3px] text-[11px] font-medium select-none ${isUser ? "text-blue-100" : "text-[#8E8E93]"}`}
              >
                {!isUser && rawText && !isStillStreamingJson && (
                  <button
                    onClick={() => onCopy(rawText, msg.id)}
                    className="flex items-center hover:text-[#3390EC] transition-colors cursor-pointer mr-0.5"
                  >
                    {copiedMessageId === msg.id ? (
                      <Check size={14} className="text-[#3390EC]" />
                    ) : (
                      <Copy size={13} />
                    )}
                  </button>
                )}
                <span>{timeString}</span>
                {isUser && <CheckCheck size={14} className="text-white" />}
              </div>
            )}
          </div>
        )}

        {/* Хвостик пузыря для пользователя */}
        {isUser && !isFileStack && (
          <svg
            viewBox="0 0 8 13"
            width="8"
            height="13"
            className="absolute -right-[7px] bottom-0 text-[#3390EC] fill-current shrink-0"
          >
            <path d="M0 0v13h8c-3.9 0-8-4.2-8-13z" />
          </svg>
        )}
      </div>
    </div>
  );
};
