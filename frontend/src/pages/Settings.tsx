// src/pages/Settings.tsx
import React, { useEffect } from "react";
import { useSettings } from "../features/settings/hooks/useSettings";
import { getTg } from "../utils/telegram";

import { SettingsProfile } from "../features/settings/components/SettingsProfile";
import { SettingsHistory } from "../features/settings/components/SettingsHistory";
import { SettingsOptions } from "../features/settings/components/SettingsOptions";
import { SettingsModals } from "../features/settings/components/SettingsModals";
import { ChevronLeft } from "lucide-react";
import { isTelegramWebApp } from "../utils/telegram";

export default function Settings() {
  const settings = useSettings();

  // Включаем нативную кнопку Назад в Telegram
  useEffect(() => {
    const tg = getTg();
    if (tg && tg.BackButton) {
      tg.BackButton.show();
      const handleBack = () => settings.navigate("/profile");
      tg.BackButton.onClick(handleBack);

      return () => {
        tg.BackButton.offClick(handleBack);
        tg.BackButton.hide();
      };
    }
  }, [settings.navigate]);

  return (
    <div className="min-h-screen w-full bg-[#F2F2F7] text-black flex flex-col pb-10 relative font-sans overflow-x-hidden">
      {/* Header */}
      <div className="h-14 px-4 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-xl z-20 border-b border-[#E5E5EA]">
        {!isTelegramWebApp() ? (
          <button
            onClick={() => settings.navigate("/profile")}
            className="w-8 h-8 -ml-2 flex items-center justify-center text-[#3390EC] active:opacity-70 transition-opacity cursor-pointer z-10"
          >
            <ChevronLeft size={28} />
          </button>
        ) : (
          <div className="w-8"></div> // Пустой блок для баланса
        )}

        <h2 className="absolute left-1/2 -translate-x-1/2 text-[17px] font-semibold text-black">
          Настройки
        </h2>

        <div className="w-8"></div>
      </div>
      <div className="flex-1 z-10 relative space-y-6 pt-6 pb-8 flex flex-col">
        <SettingsProfile
          firstName={settings.firstName}
          username={settings.username}
          photoUrl={settings.photoUrl}
          activeTab={settings.activeTab}
          setActiveTab={settings.setActiveTab}
          chatsCount={settings.chats.length}
          docsCount={settings.allDocuments.length}
          isLoadingStats={settings.isLoadingStats}
        />

        <SettingsHistory
          activeTab={settings.activeTab}
          filterPeriod={settings.filterPeriod}
          setFilterPeriod={settings.setFilterPeriod}
          customStartDate={settings.customStartDate}
          setCustomStartDate={settings.setCustomStartDate}
          customEndDate={settings.customEndDate}
          setCustomEndDate={settings.setCustomEndDate}
          isLoadingStats={settings.isLoadingStats}
          displayedChats={settings.displayedChats}
          displayedDocuments={settings.displayedDocuments}
          allFilteredChatsCount={settings.filteredChats.length}
          allFilteredDocsCount={settings.filteredDocuments.length}
          showAllChats={settings.showAllChats}
          setShowAllChats={settings.setShowAllChats}
          showAllDocuments={settings.showAllDocuments}
          setShowAllDocuments={settings.setShowAllDocuments}
          downloadingDocId={settings.downloadingDocId}
          handleDownload={settings.handleDownload}
          onDeleteChat={settings.handleDeleteChat}
        />

        <SettingsOptions
          theme={settings.theme}
          toggleTheme={settings.toggleTheme}
          notifications={settings.notifications}
          toggleNotifications={settings.toggleNotifications}
          onOpenPrivacy={() => settings.setIsPrivacyModalOpen(true)}
          onOpenClearHistory={() => settings.setIsClearHistoryModalOpen(true)}
          onLogout={settings.handleLogout}
        />
      </div>

      <SettingsModals
        isClearHistoryModalOpen={settings.isClearHistoryModalOpen}
        setIsClearHistoryModalOpen={settings.setIsClearHistoryModalOpen}
        executeClearHistory={settings.executeClearHistory}
        isClearing={settings.isClearing}
        isPrivacyModalOpen={settings.isPrivacyModalOpen}
        setIsPrivacyModalOpen={settings.setIsPrivacyModalOpen}
      />
    </div>
  );
}
