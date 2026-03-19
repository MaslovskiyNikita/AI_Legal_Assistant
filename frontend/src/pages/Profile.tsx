import React from "react";
import { useLocation } from "react-router"; 
import { useProfile } from "../features/profile/hooks/useProfile";
import { ProfileHeader } from "../features/profile/components/ProfileHeader";
import { AgentGrid } from "../features/profile/components/AgentGrid";
import { WeeklyStats } from "../features/profile/components/WeeklyStats";
import { RecentChats } from "../features/profile/components/RecentChats";
import { isTelegramWebApp } from "../utils/telegram";

export default function Profile() {
  const location = useLocation(); 
  const shouldOpenTokenModal = location.state?.openTokenModal || false; 

  const {
    internalUserId, 
    documentsAnalyzed, 
    consultationsCount, 
    firstName,
    photoUrl,
    greeting,
    selectedAgent,
    setSelectedAgent,
    recentChats,
    isLoadingRecent,
    startNewChat,
    navigate,
  } = useProfile();

  const isWeb = !isTelegramWebApp();

  return (
    <div
      className={`min-h-screen w-full bg-[var(--tg-theme-bg-color)] text-[var(--tg-theme-text-color)] relative flex flex-col font-sans overflow-x-hidden ${isWeb ? "pb-24" : ""}`}
    >
      <ProfileHeader
        firstName={firstName}
        photoUrl={photoUrl}
        greeting={greeting}
        onSettingsClick={() => navigate("/settings")}
        openTokenModal={shouldOpenTokenModal} 
      />

      <div className="px-4 flex-1 flex flex-col">
        <h1 className="text-3xl font-bold mt-2 mb-4 tracking-tight text-[var(--tg-theme-text-color)]">
          Выберите стиль
          <br />
          вашего AI-юриста
        </h1>

        <AgentGrid
          selectedAgent={selectedAgent}
          setSelectedAgent={setSelectedAgent}
        />

        <RecentChats
          isLoading={isLoadingRecent}
          chats={recentChats}
          onChatClick={(id) => navigate(`/chat/${id}`)}
        />

        {}
        <WeeklyStats
          userId={internalUserId}
          documentsAnalyzed={documentsAnalyzed}
          consultationsCount={consultationsCount}
        />
      </div>

      {isWeb && (
        <div
          className="absolute bottom-0 left-0 w-full p-4 border-t border-[var(--tg-theme-section-separator-color,rgba(128,128,128,0.2))] z-[10]"
          style={{ backgroundColor: "var(--tg-theme-bg-color)" }}
        >
          <button
            onClick={startNewChat}
            className="w-full bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color,white)] font-semibold text-[17px] py-3.5 rounded-xl shadow-md active:scale-[0.98] transition-all"
          >
            Начать новый чат
          </button>
        </div>
      )}
    </div>
  );
}
