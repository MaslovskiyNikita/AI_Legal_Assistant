
import React from "react";
import { Clock } from "lucide-react";
import { formatRecentDateShort } from "../../../utils/dateUtils";

interface RecentChatsProps {
  isLoading: boolean;
  chats: any[];
  onChatClick: (id: string) => void;
}

export const RecentChats: React.FC<RecentChatsProps> = ({
  isLoading,
  chats,
  onChatClick,
}) => {
  if (isLoading) {
    return (
      <div className="w-full">
        <div className="grid grid-cols-3 gap-2 w-full">
          <div className="h-[96px] bg-[var(--tg-theme-secondary-bg-color)] rounded-2xl animate-pulse"></div>
          <div className="h-[96px] bg-[var(--tg-theme-secondary-bg-color)] rounded-2xl animate-pulse"></div>
          <div className="h-[96px] bg-[var(--tg-theme-secondary-bg-color)] rounded-2xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (chats.length === 0) {
    return <div className="h-[100px]"></div>;
  }

  return (
    <div className="w-full">
      <h4 className="text-[13px] font-medium text-[var(--tg-theme-hint-color)] uppercase tracking-wider mb-2 ml-1">
        Продолжить
      </h4>
      <div className="grid grid-cols-3 gap-2 w-full">
        {chats.map((chat) => {
          
          
          
          const isFileComparison =
            chat.title?.toLowerCase().includes("сравнение") ||
            chat.title?.toLowerCase().includes("документ");

          return (
            <div
              key={chat.id}
              onClick={() => onChatClick(chat.id)}
              className="min-h-[96px] bg-[var(--tg-theme-secondary-bg-color)] rounded-2xl p-2.5 border border-[var(--tg-theme-section-separator-color,rgba(128,128,128,0.2))] flex flex-col justify-between cursor-pointer active:bg-[var(--tg-theme-secondary-bg-color)] transition-colors overflow-hidden"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <Clock
                    size={12}
                    className="text-[var(--tg-theme-hint-color)] shrink-0"
                  />
                  <span className="text-[11px] font-semibold text-[var(--tg-theme-hint-color)] uppercase tracking-wider truncate">
                    {formatRecentDateShort(
                      chat.created_at || chat.createdAt || chat.updated_at,
                    )}
                  </span>
                </div>
              </div>

              <span className="text-[13px] font-semibold text-[var(--tg-theme-text-color)] leading-tight line-clamp-3 mt-1">
                {chat.title || "Новая консультация"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
