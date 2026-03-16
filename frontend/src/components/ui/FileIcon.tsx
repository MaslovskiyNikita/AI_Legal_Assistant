// src/components/ui/FileIcon.tsx
import React from "react";

interface FileIconProps {
  filename: string;
}

export const FileIcon: React.FC<FileIconProps> = ({ filename }) => {
  const ext = filename?.split(".").pop()?.toLowerCase();
  let color = "text-[#3390EC]";
  let label = "DOC";

  if (ext === "pdf") {
    color = "text-[#FF3B30]";
    label = "PDF";
  } else if (ext === "docx" || ext === "doc") {
    color = "text-[#3390EC]";
    label = "DOCX";
  }

  return (
    <div className="w-11 h-11 bg-white rounded-[12px] flex items-center justify-center shrink-0 shadow-sm">
      <span className={`${color} font-bold text-[11px]`}>{label}</span>
    </div>
  );
};
