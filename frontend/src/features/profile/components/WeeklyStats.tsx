// src/features/profile/components/WeeklyStats.tsx
import React from "react";
import {
  AlertTriangle,
  FileText,
  PenSquare,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

export const WeeklyStats: React.FC = () => {
  // В будущем эти данные будут приходить с бэкенда
  const stats = {
    criticalRisks: 7,
    risksTrend: -2, // Отрицательное значение - это хорошо (рисков стало меньше)
    pagesAnalyzed: 128,
    pagesTrend: 15, // Положительное - хорошо (проанализировали больше)
    commonEdits: "Сроки, Штрафы",
  };

  return (
    <div className="mb-4 mt-4">
      <h4 className="text-[13px] font-medium text-[var(--tg-theme-hint-color)] uppercase tracking-wider mb-2 ml-1">
        Сводка за неделю
      </h4>
      <div className="bg-[var(--tg-theme-secondary-bg-color)] rounded-2xl overflow-hidden w-full p-2 space-y-2">
        {/* Карточка 1: Риски */}
        <div className="bg-[var(--tg-theme-bg-color)] rounded-xl p-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[color-mix(in_srgb,var(--tg-theme-button-color)_10%,transparent)] text-[var(--tg-theme-button-color)] flex items-center justify-center shrink-0">
              <AlertTriangle
                size={16}
                className="text-[var(--tg-theme-button-color)]"
              />
            </div>
            <span className="font-semibold text-sm text-[var(--tg-theme-text-color)]">
              Критических рисков
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Индикатор тренда (Зеленый, так как рисков стало меньше) */}
            <div className="flex items-center gap-0.5 bg-[#E5F8EB] text-[#34C759] px-1.5 py-0.5 rounded-md text-[11px] font-bold">
              <TrendingDown size={12} strokeWidth={3} />
              {Math.abs(stats.risksTrend)}
            </div>
            <span className="font-bold text-lg text-[var(--tg-theme-button-color)]">
              {stats.criticalRisks}
            </span>
          </div>
        </div>

        {/* Карточка 2: Страницы */}
        <div className="bg-[var(--tg-theme-bg-color)] rounded-xl p-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[color-mix(in_srgb,var(--tg-theme-button-color)_10%,transparent)] text-[var(--tg-theme-button-color)] flex items-center justify-center shrink-0">
              <FileText
                size={16}
                className="text-[var(--tg-theme-button-color)]"
              />
            </div>
            <span className="font-semibold text-sm text-[var(--tg-theme-text-color)]">
              Проанализировано страниц
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Индикатор тренда (Зеленый, так как страниц стало больше) */}
            <div className="flex items-center gap-0.5 bg-[#E5F8EB] text-[#34C759] px-1.5 py-0.5 rounded-md text-[11px] font-bold">
              <TrendingUp size={12} strokeWidth={3} />
              {stats.pagesTrend}%
            </div>
            <span className="font-bold text-lg text-[var(--tg-theme-button-color)]">
              {stats.pagesAnalyzed}
            </span>
          </div>
        </div>

        {/* Карточка 3: Частые правки */}
        <div className="bg-[var(--tg-theme-bg-color)] rounded-xl p-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[color-mix(in_srgb,var(--tg-theme-button-color)_10%,transparent)] text-[var(--tg-theme-button-color)] flex items-center justify-center shrink-0">
              <PenSquare
                size={16}
                className="text-[var(--tg-theme-button-color)]"
              />
            </div>
            <span className="font-semibold text-sm text-[var(--tg-theme-text-color)]">
              Частые точки правок
            </span>
          </div>
          <span className="font-semibold text-sm text-[var(--tg-theme-button-color)] truncate max-w-[120px] text-right">
            {stats.commonEdits}
          </span>
        </div>
      </div>
    </div>
  );
};
