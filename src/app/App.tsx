import React from "react";
import { 
  Scale, Shield, Folder, ChevronLeft, MoreVertical, 
  Paperclip, Send, FileText, MessageCircle, User, 
  CheckCircle2, ChevronRight 
} from "lucide-react";

// Colors defined by native Telegram Dark Mode
const COLORS = {
  bg: "#1C1C1D",
  surface: "#2C2C2E",
  primary: "#3390EC",
  textPrimary: "#FFFFFF",
  textSecondary: "#8E8E93",
};

export default function App() {
  return (
    <div className="min-h-screen bg-[#000000] flex items-center justify-start sm:justify-center p-4 sm:p-8 gap-6 overflow-x-auto font-sans">
      <ScreenOne />
      <ScreenTwo />
      <ScreenThree />
    </div>
  );
}

// ----------------------------------------------------------------------
// SCREEN 1: ONBOARDING / WELCOME
// ----------------------------------------------------------------------
function ScreenOne() {
  return (
    <div 
      className="w-[320px] h-[680px] rounded-[2.5rem] overflow-hidden relative shadow-2xl shrink-0 border-[6px] border-[#333333]"
      style={{ backgroundColor: COLORS.bg }}
    >
      {/* Background Abstract 3D/Glowing Icons Area */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1C1C1D] via-[#151D2A] to-[#1C1C1D] overflow-hidden">
        {/* Decorative Glowing Elements */}
        <div className="absolute top-[15%] left-[10%] w-32 h-32 bg-[#3390EC] rounded-full blur-[80px] opacity-20" />
        <div className="absolute top-[30%] right-[10%] w-40 h-40 bg-[#3390EC] rounded-full blur-[100px] opacity-20" />
        
        <div className="absolute top-[20%] left-[15%] drop-shadow-[0_0_15px_rgba(51,144,236,0.6)] animate-[bounce_4s_infinite]">
          <Scale size={64} color={COLORS.primary} strokeWidth={1.5} />
        </div>
        <div className="absolute top-[10%] right-[20%] drop-shadow-[0_0_12px_rgba(255,255,255,0.4)] animate-[bounce_5s_infinite_0.5s]">
          <Shield size={48} color={COLORS.textPrimary} strokeWidth={1.5} />
        </div>
        <div className="absolute top-[35%] right-[25%] drop-shadow-[0_0_15px_rgba(51,144,236,0.4)] animate-[bounce_6s_infinite_1s]">
          <Folder size={56} color={COLORS.primary} strokeWidth={1.5} opacity={0.8} />
        </div>
      </div>

      {/* Native iOS-style Bottom Sheet Modal */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-[42%] rounded-t-3xl p-6 flex flex-col justify-between backdrop-blur-xl border-t border-white/10"
        style={{ backgroundColor: 'rgba(44, 44, 46, 0.85)' }}
      >
        <div className="flex flex-col items-center text-center mt-2">
          <h1 className="text-2xl font-bold mb-3 tracking-tight text-white">
            Welcome to LegalAI
          </h1>
          <p className="text-[15px] leading-snug text-[#8E8E93]">
            Your personal legal expert inside Telegram. Analyze documents, find laws, and get legal advice instantly.
          </p>
        </div>

        <div className="flex flex-col items-center w-full gap-5 mb-2">
          {/* Pagination Dots */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-white" />
            <div className="w-2 h-2 rounded-full bg-[#4A4A4C]" />
            <div className="w-2 h-2 rounded-full bg-[#4A4A4C]" />
            <div className="w-2 h-2 rounded-full bg-[#4A4A4C]" />
          </div>

          {/* Primary Button */}
          <button 
            className="w-full py-3.5 rounded-xl font-semibold text-[17px] text-white transition-opacity active:opacity-80"
            style={{ backgroundColor: COLORS.primary }}
          >
            Let's Go!
          </button>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// SCREEN 2: MAIN AI CHAT INTERFACE
// ----------------------------------------------------------------------
function ScreenTwo() {
  return (
    <div 
      className="w-[320px] h-[680px] rounded-[2.5rem] overflow-hidden relative shadow-2xl shrink-0 border-[6px] border-[#333333] flex flex-col"
      style={{ backgroundColor: COLORS.bg }}
    >
      {/* Header */}
      <div 
        className="h-14 px-3 flex items-center justify-between border-b border-black/20"
        style={{ backgroundColor: COLORS.surface }}
      >
        <div className="flex items-center gap-2">
          <button className="text-white p-1 -ml-1">
            <ChevronLeft size={28} />
          </button>
          
          <div className="flex items-center gap-2.5">
            <div 
              className="w-9 h-9 rounded-full flex items-center justify-center relative overflow-hidden"
              style={{ backgroundColor: COLORS.primary }}
            >
              <Shield size={20} color={COLORS.textPrimary} fill="currentColor" opacity={0.3} />
              <div className="absolute inset-0 flex items-center justify-center">
                <Scale size={20} color={COLORS.textPrimary} strokeWidth={2} />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-[16px] font-semibold text-white leading-tight">
                Legal Expert AI
              </span>
              <span className="text-[13px] text-[#3390EC] font-medium leading-tight tracking-wide uppercase mt-[1px]">
                bot
              </span>
            </div>
          </div>
        </div>
        
        <button className="text-white p-1">
          <MoreVertical size={24} />
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 pb-24">
        <p className="text-center text-[12px] font-medium text-[#8E8E93] mb-2 mt-1">Today</p>
        
        {/* User Message */}
        <div className="flex justify-end">
          <div 
            className="max-w-[85%] px-3.5 py-2.5 rounded-2xl rounded-tr-sm text-[15px] leading-snug text-white shadow-sm"
            style={{ backgroundColor: COLORS.primary }}
          >
            What are the key points of this NDA?
            <div className="text-[11px] text-white/70 text-right mt-1 -mb-1 flex items-center justify-end gap-1">
              10:42 AM <CheckCircle2 size={12} className="inline" />
            </div>
          </div>
        </div>

        {/* AI Bot Message */}
        <div className="flex justify-start">
          <div 
            className="max-w-[90%] px-3.5 py-2.5 rounded-2xl rounded-tl-sm text-[15px] leading-snug text-white shadow-sm"
            style={{ backgroundColor: COLORS.surface }}
          >
            Here are the key points of the non-disclosure agreement (NDA) you provided:
            <ul className="mt-3 space-y-2 list-disc pl-4 text-[14.5px]">
              <li><strong className="text-white">Definition of Confidential Info:</strong> Covers all financial data and proprietary tech discussed.</li>
              <li><strong className="text-white">Duration:</strong> The obligations last for a period of 5 years from signing.</li>
              <li><strong className="text-white">Exclusions:</strong> Information already in the public domain is exempt.</li>
            </ul>
            <div className="text-[11px] text-[#8E8E93] text-right mt-2 -mb-1">
              10:43 AM
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Input Area */}
      <div 
        className="absolute bottom-0 left-0 right-0 flex flex-col pt-2 pb-5 px-3 backdrop-blur-md"
        style={{ backgroundColor: 'rgba(28, 28, 29, 0.95)' }}
      >
        {/* Quick Action Chips */}
        <div className="flex overflow-x-auto gap-2 pb-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] -mx-3 px-3">
          {["Summarize Doc", "Civil Code", "Check Contract"].map((text) => (
            <button 
              key={text}
              className="whitespace-nowrap px-4 py-1.5 rounded-full text-[13px] font-medium border text-white transition-colors"
              style={{ backgroundColor: COLORS.surface, borderColor: '#3A3A3C' }}
            >
              {text}
            </button>
          ))}
        </div>

        {/* Input Field */}
        <div className="flex items-end gap-2">
          <button className="p-2.5 text-[#8E8E93] hover:text-white transition-colors pb-3">
            <Paperclip size={24} className="rotate-45" />
          </button>
          
          <div 
            className="flex-1 min-h-[44px] rounded-2xl px-3 py-2.5 flex items-center border border-white/5"
            style={{ backgroundColor: COLORS.surface }}
          >
            <input 
              type="text" 
              placeholder="Ask a legal question or attach a file..." 
              className="bg-transparent border-none outline-none text-white text-[15px] w-full placeholder:text-[#8E8E93]"
            />
          </div>
          
          <button 
            className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 shadow-sm transition-transform active:scale-95"
            style={{ backgroundColor: COLORS.primary }}
          >
            <Send size={20} color="white" className="ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// SCREEN 3: USER PROFILE & HISTORY
// ----------------------------------------------------------------------
function ScreenThree() {
  const historyItems = [
    { id: 1, icon: <FileText size={20}/>, title: "NDA Review - Apple Inc.", desc: "Analysis of duration and scope terms.", time: "12:30" },
    { id: 2, icon: <Scale size={20}/>, title: "Divorce proceeding laws", desc: "California state regulations regarding...", time: "Yesterday" },
    { id: 3, icon: <Shield size={20}/>, title: "Trademark Infringement", desc: "Steps to issue a cease and desist...", time: "Mon" },
    { id: 4, icon: <FileText size={20}/>, title: "Lease Agreement Check", desc: "Renter's rights on early termination.", time: "Jan 12" },
  ];

  return (
    <div 
      className="w-[320px] h-[680px] rounded-[2.5rem] overflow-hidden relative shadow-2xl shrink-0 border-[6px] border-[#333333] flex flex-col"
      style={{ backgroundColor: COLORS.bg }}
    >
      {/* Header Profile Area */}
      <div className="pt-10 pb-6 flex flex-col items-center">
        <div className="w-20 h-20 rounded-full overflow-hidden mb-3 border-2 border-[#3390EC]/30 relative">
          <img 
            src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200&h=200" 
            alt="Alex Johnson" 
            className="w-full h-full object-cover"
          />
        </div>
        <h2 className="text-[20px] font-semibold text-white tracking-tight">Alex Johnson</h2>
        <span className="text-[14px] text-[#8E8E93] font-medium mt-0.5">@alex_j</span>
      </div>

      {/* Statistics Section */}
      <div className="px-4 flex gap-3 mb-6">
        <div 
          className="flex-1 rounded-2xl p-4 flex flex-col justify-center relative overflow-hidden backdrop-blur-md border border-white/5"
          style={{ backgroundColor: 'rgba(44, 44, 46, 0.6)' }}
        >
          <div className="absolute -right-3 -top-3 opacity-10">
            <FileText size={64} color={COLORS.primary} />
          </div>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-[#3390EC]/10 text-[#3390EC] shrink-0">
              <FileText size={16} />
            </div>
            <span className="text-[12px] leading-tight font-medium text-[#8E8E93]">Documents<br/>Analyzed</span>
          </div>
          <span className="text-[24px] font-bold text-white tracking-tight">14</span>
        </div>
        
        <div 
          className="flex-1 rounded-2xl p-4 flex flex-col justify-center relative overflow-hidden backdrop-blur-md border border-white/5"
          style={{ backgroundColor: 'rgba(44, 44, 46, 0.6)' }}
        >
          <div className="absolute -right-3 -top-3 opacity-10">
            <MessageCircle size={64} color={COLORS.primary} />
          </div>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-[#3390EC]/10 text-[#3390EC] shrink-0">
              <MessageCircle size={16} />
            </div>
            <span className="text-[12px] leading-tight font-medium text-[#8E8E93]">Consultations</span>
          </div>
          <span className="text-[24px] font-bold text-white tracking-tight">32</span>
        </div>
      </div>

      {/* History Section */}
      <div className="flex-1 bg-[#1C1C1D] flex flex-col relative pb-[60px]">
        <div className="px-4 pb-2 pt-1 flex items-center justify-between sticky top-0 bg-[#1C1C1D]/90 backdrop-blur-md z-10">
          <h3 className="text-[16px] font-semibold text-white">Recent Dialogues</h3>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {historyItems.map((item, index) => (
            <div 
              key={item.id} 
              className={`flex items-center px-4 py-3 hover:bg-white/5 transition-colors cursor-pointer ${
                index !== historyItems.length - 1 ? 'border-b border-white/5' : ''
              }`}
            >
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 mr-3"
                style={{ backgroundColor: COLORS.surface }}
              >
                <div className="text-[#3390EC]">{item.icon}</div>
              </div>
              <div className="flex-1 min-w-0 pr-2">
                <div className="flex items-center justify-between mb-0.5">
                  <h4 className="text-[16px] font-medium text-white truncate">{item.title}</h4>
                  <span className="text-[12px] text-[#8E8E93] shrink-0 ml-2">{item.time}</span>
                </div>
                <p className="text-[14px] text-[#8E8E93] truncate">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-[64px] flex items-center justify-around border-t border-black/20 pb-2 backdrop-blur-xl"
        style={{ backgroundColor: 'rgba(28, 28, 29, 0.95)' }}
      >
        <button className="flex flex-col items-center justify-center w-16 gap-1 pt-1 text-[#3390EC]">
          <MessageCircle size={24} className="fill-[#3390EC]/20" />
          <span className="text-[10px] font-medium">Chat</span>
        </button>
        <button className="flex flex-col items-center justify-center w-16 gap-1 pt-1 text-[#8E8E93] hover:text-[#3390EC] transition-colors">
          <User size={24} />
          <span className="text-[10px] font-medium">Profile</span>
        </button>
      </div>
    </div>
  );
}
