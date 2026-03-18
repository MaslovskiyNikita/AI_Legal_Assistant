// src/features/chat/components/StackedFiles.tsx
import React from "react";
import { motion } from "motion/react"; // <-- ИМПОРТ ИЗ ТВОЕЙ БИБЛИОТЕКИ
import { FileIcon } from "../../../components/ui/FileIcon";

interface StackedFilesProps {
  file1: string;
  file2: string;
  onClick: () => void;
  isScanning?: boolean;
}

export const StackedFiles: React.FC<StackedFilesProps> = ({
  file1,
  file2,
  onClick,
  isScanning,
}) => {
  return (
    // Главный контейнер
    <motion.div
      onClick={onClick}
      className="relative flex flex-col items-end my-1 mt-10 cursor-pointer z-20"
      initial="hidden"
      animate="visible"
      whileTap="tap"
      variants={{
        hidden: { opacity: 0, scale: 0.9 },
        // Запускаем дочерние анимации с задержкой 0.15с между ними
        visible: {
          opacity: 1,
          scale: 1,
          transition: { staggerChildren: 0.15 },
        },
        tap: { scale: 0.96 },
      }}
    >
      {/* Эффект сканера (если идет анализ) */}
      {isScanning && (
        <div className="absolute -inset-4 z-30 pointer-events-none overflow-hidden rounded-[24px]">
          <motion.div
            initial={{ y: "-100%" }}
            animate={{ y: "150%" }}
            transition={{
              repeat: Infinity,
              duration: 1.5,
              ease: "linear",
              repeatType: "reverse",
            }}
            className="absolute left-0 right-0 h-[3px] bg-[#34C759] shadow-[0_0_12px_4px_rgba(52,199,89,0.6)] rounded-full"
          />
        </div>
      )}

      {/* Файл 1 (Старая версия - сзади) */}
      <motion.div
        variants={{
          hidden: { rotate: 0, y: 0, x: 0, opacity: 0 },
          // Вылетает с поворотом на 6 градусов
          visible: {
            rotate: 6,
            y: -20,
            x: 10,
            opacity: 1,
            transition: { type: "spring", stiffness: 300, damping: 20 },
          },
        }}
        className="absolute inset-0 bg-[#297acc] rounded-[20px] p-2.5 pr-5 flex items-center shadow-md border border-white/20 origin-bottom-right z-0"
      >
        <FileIcon filename={file1} />
        <div className="ml-3 flex flex-col flex-1 min-w-0">
          <span className="text-white text-[15px] font-medium truncate">
            {file1.replace(/\.(pdf|docx?)$/i, "")}
          </span>
          <span className="text-blue-100/80 text-[13px] mt-0.5">
            Старая версия
          </span>
        </div>
      </motion.div>

      {/* Файл 2 (Новая версия - спереди) */}
      <motion.div
        variants={{
          hidden: { rotate: 0, y: 20, opacity: 0 },
          visible: {
            rotate: 0,
            y: 0,
            opacity: 1,
            transition: { type: "spring", stiffness: 300, damping: 24 },
          },
        }}
        className="relative min-w-[200px] max-w-[280px] bg-[#3390EC] rounded-[20px] p-2.5 pr-5 flex items-center shadow-xl border border-white/20 z-10"
      >
        <FileIcon filename={file2} />
        <div className="ml-3 flex flex-col flex-1 min-w-0">
          <span className="text-white text-[16px] font-medium truncate">
            {file2.replace(/\.(pdf|docx?)$/i, "")}
          </span>
          <span className="text-blue-100/80 text-[13px] mt-0.5">
            Новая версия
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
};
