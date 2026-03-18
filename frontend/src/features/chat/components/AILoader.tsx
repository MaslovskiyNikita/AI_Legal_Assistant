// src/features/chat/components/AILoader.tsx
import React from "react";
import { motion } from "motion/react";
import { FileSearch } from "lucide-react";

interface AILoaderProps {
  text?: string;
}

export const AILoader: React.FC<AILoaderProps> = ({
  text = "Анализирую документы и выявляю риски...",
}) => {
  return (
    <div className="flex items-center gap-2 px-1 py-1 text-[var(--tg-theme-button-color)]">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
      >
        <FileSearch size={18} />
      </motion.div>
      <motion.span
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        className="text-[14px] font-medium tracking-wide"
      >
        {text}
      </motion.span>
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
