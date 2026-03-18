// src/features/chat/components/StackedFiles.tsx
import React from "react";
import { motion } from "motion/react";
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
    <motion.div
      onClick={onClick}
      className="relative flex flex-col items-end my-1 mt-10 cursor-pointer z-20"
      initial="hidden"
      animate="visible"
      whileTap="tap"
      variants={{
        hidden: { opacity: 0, scale: 0.9 },
        visible: {
          opacity: 1,
          scale: 1,
          transition: { staggerChildren: 0.15 },
        },
        tap: { scale: 0.96 },
      }}
    >
      {/* КРУТОЙ ЭФФЕКТ ЛАЗЕРНОГО СКАНЕРА */}
      {isScanning && (
        <div className="absolute -inset-2 z-40 pointer-events-none overflow-hidden rounded-[24px]">
          {/* Полупрозрачный оверлей для акцента на сканере */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-[var(--tg-theme-button-color)]/5 backdrop-blur-[1px] z-30 rounded-[24px]"
          />
          {/* Сама линия сканера с мощным свечением */}
          <motion.div
            initial={{ y: "-20%" }}
            animate={{ y: "250%" }}
            transition={{
              repeat: Infinity,
              duration: 1.4,
              ease: "easeInOut", // Плавное замедление на краях
              repeatType: "reverse",
            }}
            className="absolute left-0 right-0 h-[2px] bg-[#34C759] shadow-[0_0_20px_6px_rgba(52,199,89,0.7)] z-40"
          />
        </div>
      )}

      {/* Файл 1 (Старая версия - сзади) */}
      <motion.div
        variants={{
          hidden: { rotate: 0, y: 0, x: 0, opacity: 0 },
          visible: {
            rotate: 6,
            y: -20,
            x: 10,
            opacity: 1,
            transition: { type: "spring", stiffness: 300, damping: 20 },
          },
        }}
        className="absolute inset-0 bg-[var(--tg-theme-button-color)] brightness-90 rounded-[20px] p-2.5 pr-5 flex items-center shadow-md border border-white/20 origin-bottom-right z-0"
      >
        <FileIcon filename={file1} />
        <div className="ml-3 flex flex-col flex-1 min-w-0">
          <span className="text-[var(--tg-theme-button-text-color)] text-[15px] font-medium truncate">
            {file1.replace(/\.(pdf|docx?)$/i, "")}
          </span>
          <span className="text-[var(--tg-theme-button-text-color)]/80 text-[13px] mt-0.5">
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
        className="relative min-w-[200px] max-w-[280px] bg-[var(--tg-theme-button-color)] rounded-[20px] p-2.5 pr-5 flex items-center shadow-xl border border-white/20 z-10"
      >
        <FileIcon filename={file2} />
        <div className="ml-3 flex flex-col flex-1 min-w-0">
          <span className="text-[var(--tg-theme-button-text-color)] text-[16px] font-medium truncate">
            {file2.replace(/\.(pdf|docx?)$/i, "")}
          </span>
          <span className="text-[var(--tg-theme-button-text-color)]/80 text-[13px] mt-0.5">
            Новая версия
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
};
