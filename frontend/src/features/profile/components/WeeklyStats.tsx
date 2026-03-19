// src/features/profile/components/WeeklyStats.tsx
import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  PenSquare,
  Loader2,
  X,
  BarChart3,
  MessageSquareText,
} from "lucide-react";
import { Drawer } from "vaul";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { apiClient } from "../../../api/client";
import { tgHaptic } from "../../../utils/telegram";

export const WeeklyStats: React.FC = () => {
  // Стейты для модалок
  const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);

  // Стейты данных
  const [isLoading, setIsLoading] = useState(true);
  const [riskStats, setRiskStats] = useState({ RED: 0, YELLOW: 0, GREEN: 0 });
  const [activityStats, setActivityStats] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const userStr = localStorage.getItem("user");
        if (userStr) {
          const user = JSON.parse(userStr);

          // Параллельно запрашиваем обе ручки
          const [risksResponse, activityResponse] = await Promise.all([
            apiClient.getRiskStatistics(user.id),
            apiClient.getActivityStatistics(user.id),
          ]);

          // Парсим риски (бэк отдает массив [{risk_type: "RED", count: 5}, ...])
          const newRisks = { RED: 0, YELLOW: 0, GREEN: 0 };
          risksResponse.forEach((item: any) => {
            if (item.risk_type in newRisks) {
              newRisks[item.risk_type as keyof typeof newRisks] = item.count;
            }
          });
          setRiskStats(newRisks);

          // Данные активности: [{date: "15.03", message_count: 12}]
          setActivityStats(activityResponse);
        }
      } catch (error) {
        console.error("Ошибка загрузки аналитики:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const totalRisks = riskStats.RED + riskStats.YELLOW + riskStats.GREEN;
  const totalMessages = activityStats.reduce(
    (sum, item) => sum + item.message_count,
    0,
  );

  // Данные для кольцевой диаграммы (PieChart)
  const donutData = [
    { name: "Критичные", value: riskStats.RED, color: "#FF3B30" },
    { name: "Средние", value: riskStats.YELLOW, color: "#FF9500" },
    { name: "Низкие", value: riskStats.GREEN, color: "#34C759" },
  ].filter((item) => item.value > 0);

  return (
    <>
      <div className="mb-4 mt-4">
        <h4 className="text-[13px] font-medium text-[var(--tg-theme-hint-color)] uppercase tracking-wider mb-2 ml-1">
          Сводка и Аналитика
        </h4>
        <div className="bg-[var(--tg-theme-secondary-bg-color)] rounded-2xl overflow-hidden w-full p-2 space-y-2 shadow-sm border border-[var(--tg-theme-section-separator-color,rgba(128,128,128,0.2))]">
          {/* 1. КЛИКАБЕЛЬНАЯ КАРТОЧКА: РИСКИ */}
          <div
            onClick={() => {
              tgHaptic("light");
              setIsRiskModalOpen(true);
            }}
            className="bg-[var(--tg-theme-bg-color)] rounded-xl p-3 flex items-center justify-between shadow-sm cursor-pointer active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#FF3B30]/10 flex items-center justify-center shrink-0">
                <AlertTriangle size={16} className="text-[#FF3B30]" />
              </div>
              <span className="font-semibold text-sm text-[var(--tg-theme-text-color)]">
                Выявленные риски
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-[#FF3B30]">
                {isLoading ? (
                  <Loader2
                    size={16}
                    className="animate-spin text-[var(--tg-theme-hint-color)]"
                  />
                ) : (
                  totalRisks
                )}
              </span>
            </div>
          </div>

          {/* 2. КЛИКАБЕЛЬНАЯ КАРТОЧКА: АКТИВНОСТЬ */}
          <div
            onClick={() => {
              tgHaptic("light");
              setIsActivityModalOpen(true);
            }}
            className="bg-[var(--tg-theme-bg-color)] rounded-xl p-3 flex items-center justify-between shadow-sm cursor-pointer active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[color-mix(in_srgb,var(--tg-theme-button-color)_10%,transparent)] flex items-center justify-center shrink-0">
                <BarChart3
                  size={16}
                  className="text-[var(--tg-theme-button-color)]"
                />
              </div>
              <span className="font-semibold text-sm text-[var(--tg-theme-text-color)]">
                Активность (7 дней)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-[var(--tg-theme-button-color)]">
                {isLoading ? (
                  <Loader2
                    size={16}
                    className="animate-spin text-[var(--tg-theme-hint-color)]"
                  />
                ) : (
                  totalMessages
                )}
              </span>
            </div>
          </div>

          {/* 3. Статическая карточка: Частые правки */}
          <div className="bg-[var(--tg-theme-bg-color)] rounded-xl p-3 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[color-mix(in_srgb,var(--tg-theme-text-color)_10%,transparent)] flex items-center justify-center shrink-0">
                <PenSquare
                  size={16}
                  className="text-[var(--tg-theme-hint-color)]"
                />
              </div>
              <span className="font-semibold text-sm text-[var(--tg-theme-text-color)]">
                Частые правки
              </span>
            </div>
            <span className="font-semibold text-[13px] text-[var(--tg-theme-hint-color)] truncate max-w-[120px] text-right">
              Сроки, Штрафы
            </span>
          </div>
        </div>
      </div>

      {/* ========================================= */}
      {/* МОДАЛКА 1: ДОНАК-ЧАРТ (РИСКИ)             */}
      {/* ========================================= */}
      <Drawer.Root open={isRiskModalOpen} onOpenChange={setIsRiskModalOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]" />
          <Drawer.Content className="bg-[var(--tg-theme-secondary-bg-color)] flex flex-col rounded-t-[24px] mt-24 fixed bottom-0 left-0 right-0 z-[110] outline-none">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-[var(--tg-theme-hint-color)] opacity-20 mt-4 mb-2" />

            <div className="px-5 pb-3 flex items-center justify-between border-b border-[var(--tg-theme-section-separator-color,rgba(128,128,128,0.2))]">
              <div>
                <Drawer.Title className="text-[18px] font-bold text-[var(--tg-theme-text-color)]">
                  Распределение рисков
                </Drawer.Title>
                <p className="text-[13px] text-[var(--tg-theme-hint-color)] mt-0.5">
                  Выявлено за всё время работы
                </p>
              </div>
              <button
                onClick={() => setIsRiskModalOpen(false)}
                className="bg-[var(--tg-theme-bg-color)] p-2 rounded-full text-[var(--tg-theme-hint-color)]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 pb-12 flex flex-col items-center">
              {isLoading ? (
                <div className="py-20">
                  <Loader2
                    size={32}
                    className="animate-spin text-[var(--tg-theme-button-color)]"
                  />
                </div>
              ) : totalRisks === 0 ? (
                <div className="py-20 text-center">
                  <AlertTriangle
                    size={48}
                    className="text-[var(--tg-theme-hint-color)] opacity-50 mx-auto mb-4"
                  />
                  <span className="text-[17px] font-semibold text-[var(--tg-theme-text-color)] block">
                    Нет данных
                  </span>
                  <span className="text-[14px] text-[var(--tg-theme-hint-color)] mt-1">
                    Проанализируйте документы
                  </span>
                </div>
              ) : (
                <>
                  <div className="relative w-full h-[220px] mb-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={donutData}
                          innerRadius={70}
                          outerRadius={95}
                          paddingAngle={6}
                          dataKey="value"
                          stroke="none"
                          cornerRadius={8}
                        >
                          {donutData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "var(--tg-theme-bg-color)",
                            border: "none",
                            borderRadius: "12px",
                            color: "var(--tg-theme-text-color)",
                            fontWeight: 600,
                            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                          }}
                          itemStyle={{ color: "var(--tg-theme-text-color)" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[36px] font-black text-[var(--tg-theme-text-color)] leading-none">
                        {totalRisks}
                      </span>
                      <span className="text-[11px] font-bold text-[var(--tg-theme-hint-color)] uppercase mt-1">
                        Всего
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-[var(--tg-theme-bg-color)] rounded-2xl p-4 shadow-sm border border-[var(--tg-theme-section-separator-color,rgba(128,128,128,0.2))] space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-3.5 h-3.5 rounded-full bg-[#FF3B30] shadow-[0_0_8px_rgba(255,59,48,0.5)]" />
                        <span className="text-[15px] font-medium text-[var(--tg-theme-text-color)]">
                          Критичные
                        </span>
                      </div>
                      <span className="font-bold text-[16px] text-[var(--tg-theme-text-color)]">
                        {riskStats.RED}
                      </span>
                    </div>
                    <div className="h-[1px] bg-[var(--tg-theme-section-separator-color,rgba(128,128,128,0.2))]" />
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-3.5 h-3.5 rounded-full bg-[#FF9500] shadow-[0_0_8px_rgba(255,149,0,0.5)]" />
                        <span className="text-[15px] font-medium text-[var(--tg-theme-text-color)]">
                          Средние
                        </span>
                      </div>
                      <span className="font-bold text-[16px] text-[var(--tg-theme-text-color)]">
                        {riskStats.YELLOW}
                      </span>
                    </div>
                    <div className="h-[1px] bg-[var(--tg-theme-section-separator-color,rgba(128,128,128,0.2))]" />
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-3.5 h-3.5 rounded-full bg-[#34C759] shadow-[0_0_8px_rgba(52,199,89,0.5)]" />
                        <span className="text-[15px] font-medium text-[var(--tg-theme-text-color)]">
                          Низкие
                        </span>
                      </div>
                      <span className="font-bold text-[16px] text-[var(--tg-theme-text-color)]">
                        {riskStats.GREEN}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* ========================================= */}
      {/* МОДАЛКА 2: СТОЛБЧАТАЯ ДИАГРАММА (АКТИВНОСТЬ) */}
      {/* ========================================= */}
      <Drawer.Root
        open={isActivityModalOpen}
        onOpenChange={setIsActivityModalOpen}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]" />
          <Drawer.Content className="bg-[var(--tg-theme-secondary-bg-color)] flex flex-col rounded-t-[24px] mt-24 fixed bottom-0 left-0 right-0 z-[110] outline-none">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-[var(--tg-theme-hint-color)] opacity-20 mt-4 mb-2" />

            <div className="px-5 pb-3 flex items-center justify-between border-b border-[var(--tg-theme-section-separator-color,rgba(128,128,128,0.2))]">
              <div>
                <Drawer.Title className="text-[18px] font-bold text-[var(--tg-theme-text-color)]">
                  Активность общения
                </Drawer.Title>
                <p className="text-[13px] text-[var(--tg-theme-hint-color)] mt-0.5">
                  Количество запросов за 7 дней
                </p>
              </div>
              <button
                onClick={() => setIsActivityModalOpen(false)}
                className="bg-[var(--tg-theme-bg-color)] p-2 rounded-full text-[var(--tg-theme-hint-color)]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 pb-12 flex flex-col items-center">
              {isLoading ? (
                <div className="py-20">
                  <Loader2
                    size={32}
                    className="animate-spin text-[var(--tg-theme-button-color)]"
                  />
                </div>
              ) : activityStats.length === 0 || totalMessages === 0 ? (
                <div className="py-20 text-center">
                  <MessageSquareText
                    size={48}
                    className="text-[var(--tg-theme-hint-color)] opacity-50 mx-auto mb-4"
                  />
                  <span className="text-[17px] font-semibold text-[var(--tg-theme-text-color)] block">
                    Нет данных
                  </span>
                  <span className="text-[14px] text-[var(--tg-theme-hint-color)] mt-1">
                    Отправьте сообщение боту
                  </span>
                </div>
              ) : (
                <>
                  <div className="w-full h-[250px] bg-[var(--tg-theme-bg-color)] rounded-2xl p-4 pt-6 pb-2 shadow-sm border border-[var(--tg-theme-section-separator-color,rgba(128,128,128,0.2))]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={activityStats}
                        margin={{ top: 0, right: 0, left: -25, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="var(--tg-theme-section-separator-color,rgba(128,128,128,0.2))"
                        />
                        <XAxis
                          dataKey="date"
                          axisLine={false}
                          tickLine={false}
                          tick={{
                            fill: "var(--tg-theme-hint-color)",
                            fontSize: 12,
                          }}
                          dy={10}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{
                            fill: "var(--tg-theme-hint-color)",
                            fontSize: 12,
                          }}
                          allowDecimals={false}
                        />
                        <Tooltip
                          cursor={{
                            fill: "var(--tg-theme-secondary-bg-color)",
                            opacity: 0.5,
                          }}
                          contentStyle={{
                            backgroundColor: "var(--tg-theme-bg-color)",
                            border:
                              "1px solid var(--tg-theme-section-separator-color,rgba(128,128,128,0.2))",
                            borderRadius: "12px",
                            color: "var(--tg-theme-text-color)",
                            fontWeight: 600,
                          }}
                          formatter={(value) => [`${value} запросов`, ""]}
                          labelStyle={{
                            color: "var(--tg-theme-hint-color)",
                            fontSize: 12,
                            marginBottom: 4,
                          }}
                        />
                        <Bar
                          dataKey="message_count"
                          fill="var(--tg-theme-button-color)"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={40}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-full mt-4 text-center">
                    <span className="text-[14px] text-[var(--tg-theme-hint-color)]">
                      Всего за неделю:{" "}
                      <strong className="text-[var(--tg-theme-text-color)]">
                        {totalMessages}
                      </strong>{" "}
                      запросов
                    </span>
                  </div>
                </>
              )}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  );
};
