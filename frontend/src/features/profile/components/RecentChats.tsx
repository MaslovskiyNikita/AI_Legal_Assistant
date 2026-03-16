// src/features/profile/components/RecentChats.tsx
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
          <div className="h-[96px] bg-[#F2F2F7] rounded-2xl animate-pulse"></div>
          <div className="h-[96px] bg-[#F2F2F7] rounded-2xl animate-pulse"></div>
          <div className="h-[96px] bg-[#F2F2F7] rounded-2xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (chats.length === 0) {
    return <div className="h-[100px]"></div>;
  }

  return (
    <div className="w-full">
      <h4 className="text-[13px] font-medium text-[#8E8E93] uppercase tracking-wider mb-2 ml-1">
        Продолжить
      </h4>
      <div className="grid grid-cols-3 gap-2 w-full">
        {chats.map((chat) => (
          <div
            key={chat.id}
            onClick={() => onChatClick(chat.id)}
            className="min-h-[96px] bg-[#F8F9FA] rounded-2xl p-2.5 border border-[#E5E5EA] flex flex-col justify-between cursor-pointer active:bg-[#E5E5EA] transition-colors overflow-hidden"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Clock size={12} className="text-[#3390EC] shrink-0" />
              <span className="text-[12px] font-semibold text-[#8E8E93] uppercase tracking-wider truncate">
                {formatRecentDateShort(
                  chat.created_at || chat.createdAt || chat.updated_at,
                )}
              </span>
            </div>
            <span className="text-[14px] font-semibold text-black leading-tight line-clamp-2">
              {chat.title || "Новая консультация"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
