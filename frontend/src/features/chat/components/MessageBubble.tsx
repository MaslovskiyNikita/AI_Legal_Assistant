// src/features/chat/components/MessageBubble.tsx
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CheckCheck, Copy, Check } from "lucide-react";
import { StackedFiles } from "./StackedFiles";

interface MessageBubbleProps {
  msg: any;
  copiedMessageId: number | string | null;
  onCopy: (text: string, id: number | string) => void;
  onDownloadClick: () => void;
  isScanning?: boolean; // <-- Добавили в интерфейс
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  msg,
  copiedMessageId,
  onCopy,
  onDownloadClick,
  isScanning, // <-- Достали из пропсов
}) => {
  const isUser = msg.role === "user";
  const timeString = new Date(msg.created_at).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const textContent = msg.text || msg.content || "";
  const showFooter = isUser || msg.isComplete;

  const spaceForTimeClass = isUser
    ? "last:after:content-[''] last:after:inline-block last:after:w-[54px] last:after:h-[10px]"
    : "last:after:content-[''] last:after:inline-block last:after:w-[68px] last:after:h-[10px]";

  const fileMatch = textContent.match(
    /Прикреплены документы для сравнения:\s*1\.\s*(.*?)\s*2\.\s*([^\n]+)/,
  );
  const isFileStack = isUser && fileMatch;

  let remainingText = "";
  if (isFileStack) {
    remainingText = textContent
      .replace(fileMatch[0], "")
      .replace(/^\n+/, "")
      .trim();
  }

  return (
    <div
      className={`flex w-full min-w-0 ${isUser ? "justify-end" : "justify-start"} mb-3 relative z-20`}
    >
      <div
        className={`relative flex items-end min-w-0 ${isUser ? "ml-auto" : "mr-auto"} ${!isFileStack ? "max-w-[85%] sm:max-w-[75%]" : ""}`}
      >
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

        {isFileStack ? (
          <div className="flex flex-col items-end">
            <StackedFiles
              file1={fileMatch[1]}
              file2={fileMatch[2]}
              onClick={onDownloadClick}
              isScanning={isScanning} // <-- Передаем в стопку файлов
            />

            {remainingText && (
              <div className="mt-2 relative px-3 pt-2 pb-2 text-[16px] leading-snug shadow-sm flex flex-col z-10 w-full min-w-0 break-words [word-break:break-word] bg-[#3390EC] text-white rounded-[18px] rounded-br-none">
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

                <div className="absolute bottom-[6px] right-[10px] flex items-center gap-[3px] text-[11px] font-medium select-none text-blue-100">
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
            className={`relative px-3 pt-2 pb-2 text-[16px] leading-snug shadow-sm flex flex-col z-10 w-full min-w-0 break-words [word-break:break-word] ${isUser ? "bg-[#3390EC] text-white rounded-[18px] rounded-br-none" : "bg-[#F2F2F7] text-black rounded-[18px] rounded-bl-none"}`}
          >
            <div className="w-full min-w-0">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ node, ...props }) => (
                    <p
                      className={`mb-1 last:mb-0 whitespace-pre-wrap break-words inline-block w-full ${showFooter ? spaceForTimeClass : ""}`}
                      {...props}
                    />
                  ),
                  table: ({ node, ...props }) => (
                    <div
                      className={`overflow-x-auto my-2 rounded-xl bg-white text-black ${showFooter ? "last:mb-5" : ""}`}
                    >
                      <table className="w-full text-left text-sm" {...props} />
                    </div>
                  ),
                  ul: ({ node, ...props }) => (
                    <ul
                      className={`list-disc ml-5 mb-1 ${showFooter ? "last:mb-5" : ""}`}
                      {...props}
                    />
                  ),
                  ol: ({ node, ...props }) => (
                    <ol
                      className={`list-decimal ml-5 mb-1 ${showFooter ? "last:mb-5" : ""}`}
                      {...props}
                    />
                  ),
                  th: ({ node, ...props }) => (
                    <th
                      className="bg-[#F8F9FA] p-2 font-semibold border-b border-[#E5E5EA]"
                      {...props}
                    />
                  ),
                  td: ({ node, ...props }) => (
                    <td
                      className="p-2 border-b border-[#E5E5EA] last:border-0"
                      {...props}
                    />
                  ),
                  a: ({ node, ...props }) => (
                    <a
                      className={`${isUser ? "text-white underline" : "text-[#3390EC] underline"} break-all`}
                      {...props}
                    />
                  ),
                  li: ({ node, ...props }) => (
                    <li className="mb-1 break-words" {...props} />
                  ),
                  strong: ({ node, ...props }) => (
                    <strong className="font-semibold" {...props} />
                  ),
                }}
              >
                {textContent}
              </ReactMarkdown>
            </div>

            {showFooter && (
              <div
                className={`absolute bottom-[6px] right-[10px] flex items-center gap-[3px] text-[11px] font-medium select-none ${isUser ? "text-blue-100" : "text-[#8E8E93]"}`}
              >
                {!isUser && textContent && (
                  <button
                    onClick={() => onCopy(textContent, msg.id)}
                    className="flex items-center hover:text-[#3390EC] transition-colors cursor-pointer mr-0.5"
                    title="Копировать"
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
