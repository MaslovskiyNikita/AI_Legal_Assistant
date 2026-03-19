// src/features/chat/components/AILoader.tsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FileSearch } from "lucide-react";

// Массив стадий анализа
const DEFAULT_STAGES = [
  "Изучаю текст документов...",
  "Сопоставляю редакции...",
  "Ищу связанные законы РБ...",
  "Выявляю скрытые риски...",
  "Формирую юридическое заключение...",
  "Финальная проверка данных...",
];

interface AILoaderProps {
  text?: string;
  stages?: string[];
}

export const AILoader: React.FC<AILoaderProps> = ({
  text,
  stages = DEFAULT_STAGES,
}) => {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    // Если передан жесткий текст, не запускаем таймер
    if (text) return;

    // Меняем стадию каждые 3.5 секунды
    const interval = setInterval(() => {
      setStageIndex((prev) => {
        // Останавливаемся на последней стадии, если ответ все еще генерируется
        if (prev < stages.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 3500);

    return () => clearInterval(interval);
  }, [text, stages.length]);

  const displayText = text || stages[stageIndex];

  return (
    <div className="flex items-center gap-2.5 px-1 py-1 text-[var(--tg-theme-button-color)] overflow-hidden min-h-[24px]">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
        className="shrink-0"
      >
        <FileSearch size={18} />
      </motion.div>
      <div className="flex-1 overflow-hidden relative">
        {/* AnimatePresence позволяет анимировать удаление старого текста и появление нового */}
        <AnimatePresence mode="wait">
          <motion.span
            key={displayText}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="text-[14px] font-medium tracking-wide block truncate"
          >
            {displayText}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
};

export const TypingLoader: React.FC = () => {
  return (
    <div className="flex items-center gap-1.5 h-5 px-1 pb-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 bg-[var(--tg-theme-hint-color)] rounded-full"
          animate={{ y: [0, -4, 0] }}
          transition={{
            repeat: Infinity,
            duration: 0.8,
            ease: "easeInOut",
            delay: i * 0.15,
          }}
        />
      ))}
    </div>
  );
};
