// src/features/profile/components/WeeklyStats.tsx
import React from "react";
import { AlertTriangle, FileText, PenSquare } from "lucide-react";

export const WeeklyStats: React.FC = () => {
  const stats = {
    criticalRisks: 7,
    pagesAnalyzed: 128,
    commonEdits: "Сроки, Штрафы",
  };

  return (
    <div className="mb-4 mt-4">
      <h4 className="text-[13px] font-medium text-[#8E8E93] uppercase tracking-wider mb-2 ml-1">
        Сводка за неделю
      </h4>
      <div className="bg-[#F2F2F7] rounded-2xl overflow-hidden w-full p-2 space-y-2">
        <div className="bg-white rounded-xl p-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#F0F8FF] flex items-center justify-center shrink-0">
              <AlertTriangle size={16} className="text-[#3390EC]" />
            </div>
            <span className="font-semibold text-sm text-black">
              Критических рисков
            </span>
          </div>
          <span className="font-bold text-lg text-[#3390EC]">
            {stats.criticalRisks}
          </span>
        </div>
        <div className="bg-white rounded-xl p-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#F0F8FF] flex items-center justify-center shrink-0">
              <FileText size={16} className="text-[#3390EC]" />
            </div>
            <span className="font-semibold text-sm text-black">
              Проанализировано страниц
            </span>
          </div>
          <span className="font-bold text-lg text-[#3390EC]">
            {stats.pagesAnalyzed}
          </span>
        </div>
        <div className="bg-white rounded-xl p-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#F0F8FF] flex items-center justify-center shrink-0">
              <PenSquare size={16} className="text-[#3390EC]" />
            </div>
            <span className="font-semibold text-sm text-black">
              Частые точки правок
            </span>
          </div>
          <span className="font-semibold text-sm text-[#3390EC] truncate">
            {stats.commonEdits}
          </span>
        </div>
      </div>
    </div>
  );
};
