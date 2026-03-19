import React, { useEffect, useState } from "react";
import {
  CheckCircle2,
  TrendingUp,
  Wallet,
  Clock,
  ShieldAlert,
  Activity,
  PieChart as PieChartIcon,
  Scale, // <-- Добавили иконку весов
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { apiClient } from "../../../api/client";

interface WeeklyStatsProps {
  userId: number | null;
  documentsAnalyzed: number;
  consultationsCount: number;
}

const COLORS = {
  RED: "#FF3B30",
  YELLOW: "#FF9500",
  GREEN: "#34C759",
  BLUE: "#3390EC",
};

// Генерация массива 7 дат с подстановкой данных от бэка
const getFilledActivityData = (backendData: any[]) => {
  const dates = [];
  const today = new Date();

  for (let i = -4; i <= 2; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    dates.push(`${day}.${month}`);
  }

  return dates.map((dateStr) => {
    const found = backendData.find((item) => item.date === dateStr);
    // Бэкенд теперь присылает message_count вместо count
    return { date: dateStr, count: found ? found.message_count : 0 };
  });
};

export const WeeklyStats: React.FC<WeeklyStatsProps> = ({
  userId,
  documentsAnalyzed,
  consultationsCount,
}) => {
  const [risks, setRisks] = useState({ RED: 0, YELLOW: 0, GREEN: 0 });
  const [activityRaw, setActivityRaw] = useState<any[]>([]);
  const [topLaws, setTopLaws] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    // Стучимся сразу в 3 ручки
    Promise.all([
      apiClient.getRiskStatistics(userId).catch(() => []),
      apiClient.getActivityStatistics(userId).catch(() => []),
      apiClient.getLawStatistics(userId).catch(() => []),
    ])
      .then(([risksData, activityData, lawsData]) => {
        // Парсим массив рисков под новые ключи (risk_type)
        const parsedRisks = { RED: 0, YELLOW: 0, GREEN: 0 };
        if (Array.isArray(risksData)) {
          risksData.forEach((item: any) => {
            if (item.risk_type === "RED") parsedRisks.RED = item.count;
            if (item.risk_type === "YELLOW") parsedRisks.YELLOW = item.count;
            if (item.risk_type === "GREEN") parsedRisks.GREEN = item.count;
          });
        }
        setRisks(parsedRisks);
        setActivityRaw(activityData);
        setTopLaws(lawsData || []);
      })
      .finally(() => setIsLoading(false));
  }, [userId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="w-8 h-8 border-2 border-[var(--tg-theme-button-color)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // === 1. РИСКИ ===
  const totalRisks = risks.RED + risks.YELLOW + risks.GREEN;
  const riskData = [
    { name: "Критичные", value: risks.RED, color: COLORS.RED },
    { name: "Средние", value: risks.YELLOW, color: COLORS.YELLOW },
    { name: "В норме", value: risks.GREEN, color: COLORS.GREEN },
  ];

  let safetyScore = 100;
  if (totalRisks > 0) {
    const penalty = (risks.RED * 3 + risks.YELLOW * 1) / (totalRisks * 3);
    safetyScore = Math.round((1 - penalty) * 100);
  }
  let scoreColor = COLORS.GREEN;
  if (safetyScore < 70) scoreColor = COLORS.YELLOW;
  if (safetyScore < 40) scoreColor = COLORS.RED;

  // === 2. АКТИВНОСТЬ ===
  const filledActivityData = getFilledActivityData(activityRaw);
  const totalActivityCount = filledActivityData.reduce(
    (acc, curr) => acc + curr.count,
    0,
  );

  // === 3. ГЕЙМИФИКАЦИЯ ===
  const savedMoney = consultationsCount * 1500;
  const savedHours = consultationsCount * 2;

  // Тултип для столбцов
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[var(--tg-theme-bg-color)] p-2 rounded-xl shadow-lg border border-[var(--tg-theme-section-separator-color,rgba(128,128,128,0.2))] text-[12px] font-medium text-[var(--tg-theme-text-color)] z-50">
          <span className="text-[var(--tg-theme-hint-color)]">{label}:</span>{" "}
          <span className="font-bold text-[var(--tg-theme-button-color)]">
            {payload[0].value} запросов
          </span>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="mb-8 mt-6 space-y-6">
      {/* 1. ИНДЕКС И ГЕЙМИФИКАЦИЯ */}
      <section>
        <h4 className="text-[13px] font-medium text-[var(--tg-theme-hint-color)] uppercase tracking-wider mb-3 ml-1">
          Общая сводка
        </h4>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="col-span-2 bg-[var(--tg-theme-bg-color)] rounded-2xl p-4 border border-[var(--tg-theme-section-separator-color,rgba(128,128,128,0.2))] shadow-sm flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 mb-1 text-[var(--tg-theme-text-color)]">
                <ShieldAlert size={16} style={{ color: scoreColor }} />
                <span className="text-[13px] font-bold uppercase tracking-wide">
                  Индекс безопасности
                </span>
              </div>
              <p className="text-[12px] text-[var(--tg-theme-hint-color)]">
                Качество ваших контрагентов
              </p>
            </div>
            <div
              className="text-3xl font-extrabold"
              style={{ color: scoreColor }}
            >
              {safetyScore}%
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#34C759]/10 to-[#34C759]/5 rounded-2xl p-4 border border-[#34C759]/20 shadow-sm relative overflow-hidden">
            <Wallet
              size={40}
              className="absolute -right-2 -bottom-2 text-[#34C759] opacity-20"
            />
            <div className="flex items-center gap-1.5 mb-1 text-[#34C759]">
              <TrendingUp size={16} />
              <span className="text-[12px] font-bold uppercase tracking-wide">
                Сэкономлено
              </span>
            </div>
            <span className="text-xl font-bold text-[var(--tg-theme-text-color)]">
              ~{savedMoney.toLocaleString("ru-RU")} ₽
            </span>
          </div>

          <div className="bg-gradient-to-br from-[#3390EC]/10 to-[#3390EC]/5 rounded-2xl p-4 border border-[#3390EC]/20 shadow-sm relative overflow-hidden">
            <Clock
              size={40}
              className="absolute -right-2 -bottom-2 text-[#3390EC] opacity-20"
            />
            <div className="flex items-center gap-1.5 mb-1 text-[#3390EC]">
              <Clock size={16} />
              <span className="text-[12px] font-bold uppercase tracking-wide">
                Время
              </span>
            </div>
            <span className="text-xl font-bold text-[var(--tg-theme-text-color)]">
              {savedHours} часов
            </span>
          </div>
        </div>
      </section>

      {/* 2. АНАЛИТИКА РИСКОВ (Кольцевая диаграмма) */}
      <section>
        <h4 className="text-[13px] font-medium text-[var(--tg-theme-hint-color)] uppercase tracking-wider mb-3 ml-1 flex items-center gap-1.5">
          <PieChartIcon
            size={14}
            className="text-[var(--tg-theme-button-color)]"
          />
          Аналитика документов
        </h4>
        <div className="bg-[var(--tg-theme-secondary-bg-color)] rounded-2xl p-2 border border-[var(--tg-theme-section-separator-color,rgba(128,128,128,0.2))]">
          <div className="bg-[var(--tg-theme-bg-color)] rounded-xl p-4 shadow-sm">
            {totalRisks === 0 ? (
              <div className="h-[140px] flex flex-col items-center justify-center text-[var(--tg-theme-hint-color)]">
                <CheckCircle2 size={32} className="mb-2 opacity-50" />
                <span className="text-[13px]">Нет найденных рисков</span>
              </div>
            ) : (
              <div className="flex items-center">
                <div className="w-[120px] h-[120px] shrink-0 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={riskData}
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={55}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {riskData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold leading-none text-[var(--tg-theme-button-color)]">
                      {totalRisks}
                    </span>
                  </div>
                </div>

                <div className="flex-1 flex flex-col justify-center pl-6 space-y-3">
                  {riskData.map((risk, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: risk.color }}
                        ></div>
                        <span className="text-[13px] text-[var(--tg-theme-text-color)] font-medium">
                          {risk.name}
                        </span>
                      </div>
                      <span className="text-[14px] font-bold text-[var(--tg-theme-text-color)]">
                        {risk.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3. АКТИВНОСТЬ ПО ДНЯМ */}
      <section>
        <h4 className="text-[13px] font-medium text-[var(--tg-theme-hint-color)] uppercase tracking-wider mb-3 ml-1 flex items-center gap-1.5">
          <Activity size={14} /> Активность общения
        </h4>
        <div className="bg-[var(--tg-theme-bg-color)] rounded-2xl pt-6 pb-4 px-4 border border-[var(--tg-theme-section-separator-color,rgba(128,128,128,0.2))] shadow-sm">
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={filledActivityData}
                margin={{ top: 0, right: 0, left: -25, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="4 4"
                  vertical={false}
                  stroke="var(--tg-theme-section-separator-color, rgba(128,128,128,0.2))"
                />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--tg-theme-hint-color)", fontSize: 11 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--tg-theme-hint-color)", fontSize: 11 }}
                  allowDecimals={false}
                  width={35}
                />
                <Tooltip
                  cursor={{ fill: "var(--tg-theme-secondary-bg-color)" }}
                  content={<CustomBarTooltip />}
                />
                <Bar
                  dataKey="count"
                  fill="var(--tg-theme-button-color)"
                  radius={[6, 6, 0, 0]}
                  barSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 text-center">
            <span className="text-[14px] text-[var(--tg-theme-hint-color)]">
              Всего за неделю:{" "}
              <strong className="text-[var(--tg-theme-text-color)]">
                {totalActivityCount}
              </strong>{" "}
              запросов
            </span>
          </div>
        </div>
      </section>

      {/* 4. ТОП НАРУШЕНИЙ (Прогресс-бары) */}
      {topLaws.length > 0 && (
        <section>
          <h4 className="text-[13px] font-medium text-[var(--tg-theme-hint-color)] uppercase tracking-wider mb-3 ml-1 flex items-center gap-1.5">
            <Scale size={14} /> Частые нарушения законов
          </h4>
          <div className="bg-[var(--tg-theme-bg-color)] rounded-2xl p-4 border border-[var(--tg-theme-section-separator-color,rgba(128,128,128,0.2))] shadow-sm space-y-4">
            {topLaws.map((item: any, idx: number) => {
              // Берем максимальное значение для вычисления % ширины прогресс-бара
              const maxCount = topLaws[0].count;
              const percent = Math.max((item.count / maxCount) * 100, 10);

              return (
                <div key={idx} className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-[13px]">
                    <span className="font-semibold text-[var(--tg-theme-text-color)] truncate pr-4">
                      {item.law_name}
                    </span>
                    <span className="font-bold text-[var(--tg-theme-hint-color)]">
                      {item.count}
                    </span>
                  </div>
                  <div className="w-full bg-[var(--tg-theme-secondary-bg-color)] h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#FF9500] rounded-full"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <div className="pb-8"></div>
    </div>
  );
};
