// src/features/profile/components/AgentGrid.tsx
import React from "react";
import { CheckCircle2 } from "lucide-react";
import { agents } from "../data/agents";

interface AgentGridProps {
  selectedAgent: string;
  setSelectedAgent: (id: string) => void;
}

export const AgentGrid: React.FC<AgentGridProps> = ({
  selectedAgent,
  setSelectedAgent,
}) => {
  return (
    <div className="grid grid-cols-2 gap-3 mb-4">
      {agents.map((agent) => {
        const isSelected = selectedAgent === agent.id;
        const Icon = agent.icon;
        return (
          <div
            key={agent.id}
            onClick={() => setSelectedAgent(agent.id)}
            className={`rounded-2xl p-4 flex flex-col relative transition-all cursor-pointer border ${agent.size === "large" ? "col-span-1 row-span-2 min-h-[160px]" : "col-span-1"} ${isSelected ? "bg-[color-mix(in_srgb,var(--tg-theme-button-color)_10%,transparent)] text-[var(--tg-theme-button-color)] border-[#3390EC]" : "bg-[var(--tg-theme-secondary-bg-color)] border-transparent hover:bg-[var(--tg-theme-secondary-bg-color)]"}`}
          >
            {isSelected && (
              <CheckCircle2
                size={18}
                className="absolute top-3 right-3 text-[var(--tg-theme-button-color)]"
                fill="white"
              />
            )}
            <div
              className={`w-10 h-10 rounded-full mb-auto flex items-center justify-center shrink-0 ${isSelected ? "bg-[var(--tg-theme-button-color)] text-white shadow-sm shadow-blue-500/20" : "bg-[var(--tg-theme-bg-color)] text-[var(--tg-theme-hint-color)] shadow-sm"}`}
            >
              <Icon size={20} />
            </div>
            <div className="mt-4">
              <h3 className="text-[14px] font-semibold leading-tight text-[var(--tg-theme-text-color)]">
                {agent.title}
              </h3>
              {agent.description && (
                <p
                  className={`text-[12px] mt-1 line-clamp-2 ${isSelected ? "text-[var(--tg-theme-button-color)]" : "text-[var(--tg-theme-hint-color)]"}`}
                >
                  {agent.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
