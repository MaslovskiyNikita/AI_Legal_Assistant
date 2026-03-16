// src/features/chat/components/StackedFiles.tsx
import React from "react";
import { FileIcon } from "../../../components/ui/FileIcon";

interface StackedFilesProps {
  file1: string;
  file2: string;
  onClick: () => void;
}

export const StackedFiles: React.FC<StackedFilesProps> = ({
  file1,
  file2,
  onClick,
}) => {
  return (
    <div className="flex flex-col items-end my-1 mt-10 relative z-20">
      <div
        onClick={onClick}
        className="relative inline-flex cursor-pointer active:opacity-80 transition-opacity"
      >
        <div className="absolute inset-0 bg-[#297acc] rounded-[20px] p-2.5 pr-5 flex items-center shadow-md border border-white/20 transform origin-bottom-right rotate-[4deg] -translate-y-5 translate-x-2 z-0">
          <FileIcon filename={file1} />
          <div className="ml-3 flex flex-col flex-1 min-w-0">
            <span className="text-white text-[15px] font-medium truncate">
              {file1.replace(/\.(pdf|docx?)$/i, "")}
            </span>
            <span className="text-blue-100/80 text-[13px] mt-0.5">
              Старая версия
            </span>
          </div>
        </div>
        <div className="relative min-w-[200px] max-w-[280px] bg-[#3390EC] rounded-[20px] p-2.5 pr-5 flex items-center shadow-lg border border-white/20 z-10">
          <FileIcon filename={file2} />
          <div className="ml-3 flex flex-col flex-1 min-w-0">
            <span className="text-white text-[16px] font-medium truncate">
              {file2.replace(/\.(pdf|docx?)$/i, "")}
            </span>
            <span className="text-blue-100/80 text-[13px] mt-0.5">
              Новая версия
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
