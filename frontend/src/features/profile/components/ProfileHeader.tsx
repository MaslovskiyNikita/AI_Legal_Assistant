// src/features/profile/components/ProfileHeader.tsx
import React from "react";

const TokenCircleMenu = ({ percent }: { percent: number }) => {
  const radius = 15;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="group relative flex items-center justify-center w-10 h-10 bg-white rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.06)] border border-[#F2F2F7] cursor-pointer active:scale-95 transition-all z-50">
      <svg width="36" height="36" className="transform -rotate-90">
        <circle
          cx="18"
          cy="18"
          r={radius}
          stroke="#F2F2F7"
          strokeWidth="3.5"
          fill="transparent"
        />
        <circle
          cx="18"
          cy="18"
          r={radius}
          stroke="#3390EC"
          strokeWidth="3.5"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <span className="absolute text-[10px] font-bold text-black tracking-tighter">
        {percent}%
      </span>
    </div>
  );
};

interface ProfileHeaderProps {
  firstName: string;
  greeting: string;
  onSettingsClick: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  firstName,
  greeting,
  onSettingsClick,
}) => (
  <div className="flex items-center justify-between px-4 pt-4 pb-3 relative z-20">
    <div
      className="flex items-center gap-3 cursor-pointer"
      onClick={onSettingsClick}
    >
      <div className="w-10 h-10 rounded-full bg-[#3390EC] flex items-center justify-center text-white font-medium text-lg shadow-sm">
        {firstName.charAt(0).toUpperCase()}
      </div>
      <div className="flex flex-col">
        <span className="text-[16px] font-semibold leading-tight text-black">
          {firstName}
        </span>
        <span className="text-[13px] text-[#8E8E93]">{greeting}</span>
      </div>
    </div>
    <TokenCircleMenu percent={33} />
  </div>
);
