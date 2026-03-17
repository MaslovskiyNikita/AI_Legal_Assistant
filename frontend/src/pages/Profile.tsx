// src/pages/Profile.tsx
import React from "react";
import { Plus } from "lucide-react";
import { useProfile } from "../features/profile/hooks/useProfile";
import { ProfileHeader } from "../features/profile/components/ProfileHeader";
import { AgentGrid } from "../features/profile/components/AgentGrid";
import { WeeklyStats } from "../features/profile/components/WeeklyStats";
import { RecentChats } from "../features/profile/components/RecentChats";

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

  return (
    <div className="min-h-screen w-full bg-white text-black relative flex flex-col font-sans overflow-x-hidden">
      <ProfileHeader
        firstName={firstName}
        photoUrl={photoUrl}
        greeting={greeting}
        onSettingsClick={() => navigate("/settings")}
      />

      <div className="px-4 flex-1 flex flex-col">
        <h1 className="text-3xl font-bold mt-2 mb-4 tracking-tight text-black">
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
    </div>
  );
}
