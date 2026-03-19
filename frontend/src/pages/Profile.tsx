// src/pages/Profile.tsx
import React from "react";
import { Plus } from "lucide-react";
import { useProfile } from "../features/profile/hooks/useProfile";
import { ProfileHeader } from "../features/profile/components/ProfileHeader";
import { AgentGrid } from "../features/profile/components/AgentGrid";
import { WeeklyStats } from "../features/profile/components/WeeklyStats";
import { RecentChats } from "../features/profile/components/RecentChats";
import { isTelegramWebApp } from "../utils/telegram";

export default function Profile() {
  const {
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

  const isWeb = !isTelegramWebApp(); // Проверка на браузер

  return (
    // Добавили pb-20, чтобы контент не перекрывался кнопкой внизу
    <div
      className={`min-h-screen w-full bg-[var(--tg-theme-bg-color)] text-[var(--tg-theme-text-color)] relative flex flex-col font-sans overflow-x-hidden ${isWeb ? "pb-24" : ""}`}
    >
      <ProfileHeader
        firstName={firstName}
        photoUrl={photoUrl}
        greeting={greeting}
        onSettingsClick={() => navigate("/settings")}
      />

      {/* Основной контент */}
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

        <WeeklyStats />
      </div>

      {/* Кнопка только для веб-версии */}

      {isWeb && (
        <div className="absolute bottom-0 left-0 w-full p-4 bg-[color-mix(in_srgb,var(--tg-theme-bg-color)_85%,transparent)] backdrop-blur-md border-t border-[var(--tg-theme-section-separator-color,rgba(128,128,128,0.2))] z-30">
          <button
            onClick={startNewChat}
            className="w-full bg-[var(--tg-theme-button-color)] text-white font-semibold text-[17px] py-3.5 rounded-xl shadow-md active:scale-[0.98] transition-all"
          >
            Начать новый чат
          </button>
        </div>
      )}
    </div>
  );
}
