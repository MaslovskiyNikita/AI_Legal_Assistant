// src/features/settings/components/SettingsProfile.tsx
import React from "react";
import { MessageSquare, FileText, CheckCircle2 } from "lucide-react";

interface SettingsProfileProps {
  firstName: string;
  username: string;
  photoUrl?: string | null;
  activeTab: "chats" | "documents";
  setActiveTab: (tab: "chats" | "documents") => void;
  chatsCount: number;
  docsCount: number;
  isLoadingStats: boolean;
}

export const SettingsProfile: React.FC<SettingsProfileProps> = ({
  firstName,
  username,
  photoUrl,
  activeTab,
  setActiveTab,
  chatsCount,
  docsCount,
  isLoadingStats,
}) => (
  <div className="flex flex-col items-center justify-center px-4 shrink-0">
    {photoUrl ? (
      <img
        src={photoUrl}
        alt={firstName}
        className="w-20 h-20 rounded-full object-cover mb-3 shadow-sm"
      />
    ) : (
      <div className="w-20 h-20 rounded-full bg-[#3390EC] flex items-center justify-center text-white text-3xl font-medium mb-3 shadow-sm">
        {firstName.charAt(0).toUpperCase()}
      </div>
    )}
    <h1 className="text-2xl font-bold text-black mb-0.5">{firstName}</h1>
    <p className="text-[15px] text-[#8E8E93] mb-6">{username}</p>

    <div className="w-full flex gap-3">
      <div
        onClick={() => setActiveTab("chats")}
        className={`flex-1 border rounded-2xl p-4 flex flex-col items-center justify-center shadow-sm relative transition-all cursor-pointer ${activeTab === "chats" ? "bg-[#F0F8FF] border-[#3390EC]" : "bg-white border-[#E5E5EA] active:bg-[#F2F2F7]"}`}
      >
        {activeTab === "chats" && (
          <CheckCircle2
            size={18}
            className="absolute top-3 right-3 text-[#3390EC]"
            fill="white"
          />
        )}
        <div
          className={`w-10 h-10 rounded-full mb-1.5 flex items-center justify-center ${activeTab === "chats" ? "bg-[#3390EC] text-white shadow-sm shadow-blue-500/20" : "bg-[#F2F2F7] text-[#8E8E93]"}`}
        >
          <MessageSquare size={20} />
        </div>

        {/* Скелетная загрузка вместо Loader2 */}
        {isLoadingStats ? (
          <div className="h-8 w-12 bg-[#E5E5EA] animate-pulse rounded-md mb-0.5" />
        ) : (
          <span className="text-2xl font-bold text-black mb-0.5">
            {chatsCount}
          </span>
        )}

        <span
          className={`text-[11px] font-semibold uppercase tracking-wide ${activeTab === "chats" ? "text-[#3390EC]" : "text-[#8E8E93]"}`}
        >
          Консультаций
        </span>
      </div>

      <div
        onClick={() => setActiveTab("documents")}
        className={`flex-1 border rounded-2xl p-4 flex flex-col items-center justify-center shadow-sm relative transition-all cursor-pointer ${activeTab === "documents" ? "bg-[#F0F8FF] border-[#3390EC]" : "bg-white border-[#E5E5EA] active:bg-[#F2F2F7]"}`}
      >
        {activeTab === "documents" && (
          <CheckCircle2
            size={18}
            className="absolute top-3 right-3 text-[#3390EC]"
            fill="white"
          />
        )}
        <div
          className={`w-10 h-10 rounded-full mb-1.5 flex items-center justify-center ${activeTab === "documents" ? "bg-[#3390EC] text-white shadow-sm shadow-blue-500/20" : "bg-[#F2F2F7] text-[#8E8E93]"}`}
        >
          <FileText size={20} />
        </div>

        {/* Скелетная загрузка вместо Loader2 */}
        {isLoadingStats ? (
          <div className="h-8 w-12 bg-[#E5E5EA] animate-pulse rounded-md mb-0.5" />
        ) : (
          <span className="text-2xl font-bold text-black mb-0.5">
            {docsCount}
          </span>
        )}

        <span
          className={`text-[11px] font-semibold uppercase tracking-wide ${activeTab === "documents" ? "text-[#3390EC]" : "text-[#8E8E93]"}`}
        >
          Документов
        </span>
      </div>
    </div>
  </div>
);
