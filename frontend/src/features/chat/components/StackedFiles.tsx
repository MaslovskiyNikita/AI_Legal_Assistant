// src/features/chat/components/StackedFiles.tsx
import React from "react";
import { motion } from "motion/react";
import { FileIcon } from "../../../components/ui/FileIcon";
import { Sparkles } from "lucide-react";

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
          <span className="text-white text-[15px] font-medium truncate">
            {file1.replace(/\.(pdf|docx?)$/i, "")}
          </span>
          <span className="text-white/80 text-[13px] mt-0.5">
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
        className="relative min-w-[200px] max-w-[280px] z-10"
      >
        {/* Карточка документа */}
        <div className="relative bg-[var(--tg-theme-button-color)] rounded-[20px] p-2.5 pr-5 flex items-center shadow-xl border border-white/20 overflow-hidden">
          <FileIcon filename={file2} />
          <div className="ml-3 flex flex-col flex-1 min-w-0 z-10 relative">
            <span className="text-white text-[16px] font-medium truncate">
              {file2.replace(/\.(pdf|docx?)$/i, "")}
            </span>
            <span className="text-white/80 text-[13px] mt-0.5">
              Новая версия
            </span>
          </div>

          {/* AI: Бегающий блик (Shimmer) внутри карточки */}
          {isScanning && (
            <motion.div
              className="absolute inset-0 w-[200%] bg-gradient-to-r from-transparent via-white to-transparent pointer-events-none z-20"
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: "50%", opacity: 0.25 }}
              transition={{
                repeat: Infinity,
                duration: 1.5,
                ease: "easeInOut",
              }}
            />
          )}
        </div>

        {/* AI: Дышащая неоновая обводка вокруг карточки */}
        {isScanning && (
          <motion.div
            className="absolute inset-0 rounded-[20px] pointer-events-none border-[2px] border-[var(--tg-theme-button-color)] z-0"
            animate={{ opacity: [0, 0.8, 0], scale: [1, 1.02, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          />
        )}

        {/* AI: Парящая искорка в углу */}
        {isScanning && (
          <motion.div
            className="absolute -top-3 -right-3 w-8 h-8 bg-[var(--tg-theme-bg-color)] rounded-full flex items-center justify-center shadow-lg border border-[color-mix(in_srgb,var(--tg-theme-text-color)_10%,transparent)] z-50 text-[var(--tg-theme-button-color)]"
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 5, ease: "linear" }}
            >
              <Sparkles size={16} fill="currentColor" />
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};
