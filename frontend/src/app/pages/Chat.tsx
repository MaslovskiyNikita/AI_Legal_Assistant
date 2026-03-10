// src/app/pages/Chat.tsx
import React from "react";
import { ChevronLeft, MoreVertical, Paperclip, Send, Shield, Scale, CheckCircle2 } from "lucide-react";
import { useNavigate, useParams } from "react-router";

const COLORS = {
  bg: "#1C1C1D",
  surface: "#2C2C2E",
  primary: "#3390EC",
};

export default function Chat() {
  const navigate = useNavigate();
  const { chatId } = useParams(); // получаем ID чата из URL (может быть 'new' или числом)

  return (
    <div className="min-h-screen w-full relative flex flex-col bg-[#1C1C1D]">
      {/* Header */}
      <div className="h-14 px-3 flex items-center justify-between border-b border-black/20 sticky top-0 z-10" style={{ backgroundColor: COLORS.surface }}>
        <div className="flex items-center gap-2">
          {/* Кнопка НАЗАД */}
          <button onClick={() => navigate(-1)} className="text-white p-1 -ml-1 hover:bg-white/10 rounded-full transition-colors cursor-pointer">
            <ChevronLeft size={28} />
          </button>
          
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full flex items-center justify-center relative overflow-hidden" style={{ backgroundColor: COLORS.primary }}>
              <Shield size={20} color="#fff" fill="currentColor" opacity={0.3} />
              <div className="absolute inset-0 flex items-center justify-center">
                <Scale size={20} color="#fff" strokeWidth={2} />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-[16px] font-semibold text-white leading-tight">Legal Expert AI</span>
              <span className="text-[13px] text-[#3390EC] font-medium leading-tight tracking-wide uppercase mt-[1px]">bot</span>
            </div>
          </div>
        </div>
        <button className="text-white p-1 hover:bg-white/10 rounded-full transition-colors cursor-pointer"><MoreVertical size={24} /></button>
      </div>

      {/* Chat Area - Динамический рендер */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 pb-32">
        {chatId === 'new' ? (
          // ЕСЛИ НОВЫЙ ЧАТ - показываем пустой экран-приветствие
          <div className="flex flex-col items-center justify-center h-full text-center text-[#8E8E93] mt-10">
             <div className="w-16 h-16 bg-[#2C2C2E] rounded-full flex items-center justify-center mb-4">
                <Shield size={32} color="#3390EC" />
             </div>
             <p className="text-[16px] font-medium text-white mb-2">Start a New Consultation</p>
             <p className="text-[14px] max-w-[250px]">Ask me any legal question or attach a document for analysis.</p>
          </div>
        ) : (
          // ЕСЛИ СТАРЫЙ ЧАТ - показываем историю
          <>
            <p className="text-center text-[12px] font-medium text-[#8E8E93] mb-2 mt-1">Today</p>
            
            <div className="flex justify-end">
              <div className="max-w-[85%] px-3.5 py-2.5 rounded-2xl rounded-tr-sm text-[15px] leading-snug text-white shadow-sm" style={{ backgroundColor: COLORS.primary }}>
                What are the key points of this NDA? (Chat ID: {chatId})
                <div className="text-[11px] text-white/70 text-right mt-1 -mb-1 flex items-center justify-end gap-1">
                  10:42 AM <CheckCircle2 size={12} className="inline" />
                </div>
              </div>
            </div>

            <div className="flex justify-start">
              <div className="max-w-[90%] px-3.5 py-2.5 rounded-2xl rounded-tl-sm text-[15px] leading-snug text-white shadow-sm" style={{ backgroundColor: COLORS.surface }}>
                Here are the key points of the non-disclosure agreement (NDA) you provided:
                <ul className="mt-3 space-y-2 list-disc pl-4 text-[14.5px]">
                  <li><strong className="text-white">Definition of Confidential Info:</strong> Covers all financial data.</li>
                  <li><strong className="text-white">Duration:</strong> The obligations last for a period of 5 years.</li>
                </ul>
                <div className="text-[11px] text-[#8E8E93] text-right mt-2 -mb-1">10:43 AM</div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bottom Input Area */}
      <div className="fixed bottom-0 left-0 right-0 flex flex-col pt-2 pb-5 px-3 backdrop-blur-md max-w-md mx-auto z-50" style={{ backgroundColor: 'rgba(28, 28, 29, 0.95)' }}>
        {/* Quick Action Chips */}
        <div className="flex overflow-x-auto gap-2 pb-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] -mx-3 px-3">
          {["Summarize Doc", "Civil Code", "Check Contract"].map((text) => (
            <button key={text} className="whitespace-nowrap px-4 py-1.5 rounded-full text-[13px] font-medium border text-white transition-colors cursor-pointer hover:bg-white/10" style={{ backgroundColor: COLORS.surface, borderColor: '#3A3A3C' }}>
              {text}
            </button>
          ))}
        </div>

        {/* Text Input */}
        <div className="flex items-end gap-2">
          <button className="p-2.5 text-[#8E8E93] hover:text-white transition-colors pb-3 cursor-pointer"><Paperclip size={24} className="rotate-45" /></button>
          <div className="flex-1 min-h-[44px] rounded-2xl px-3 py-2.5 flex items-center border border-white/5" style={{ backgroundColor: COLORS.surface }}>
            <input type="text" placeholder="Ask a legal question..." className="bg-transparent border-none outline-none text-white text-[15px] w-full placeholder:text-[#8E8E93]" />
          </div>
          <button className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 shadow-sm transition-transform active:scale-95 cursor-pointer" style={{ backgroundColor: COLORS.primary }}>
            <Send size={20} color="white" className="ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}