// src/app/pages/Profile.tsx
import React from "react";
import { FileText, Scale, Shield, MessageCircle, User } from "lucide-react";
import { useNavigate } from "react-router";

const COLORS = {
  bg: "#1C1C1D",
  surface: "#2C2C2E",
  primary: "#3390EC",
};

export default function Profile() {
  const navigate = useNavigate();
  
  const historyItems = [
    { id: 1, icon: <FileText size={20}/>, title: "NDA Review - Apple Inc.", desc: "Analysis of duration and scope terms.", time: "12:30" },
    { id: 2, icon: <Scale size={20}/>, title: "Divorce proceeding laws", desc: "California state regulations regarding...", time: "Yesterday" },
    { id: 3, icon: <Shield size={20}/>, title: "Trademark Infringement", desc: "Steps to issue a cease and desist...", time: "Mon" },
    { id: 4, icon: <FileText size={20}/>, title: "Lease Agreement Check", desc: "Renter's rights on early termination.", time: "Jan 12" },
  ];

  return (
    <div className="min-h-screen w-full relative flex flex-col bg-[#1C1C1D]">
      {/* Header Profile */}
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

      {/* Stats */}
      <div className="px-4 flex gap-3 mb-6">
        <div className="flex-1 rounded-2xl p-4 flex flex-col justify-center relative overflow-hidden backdrop-blur-md border border-white/5" style={{ backgroundColor: 'rgba(44, 44, 46, 0.6)' }}>
          <div className="absolute -right-3 -top-3 opacity-10"><FileText size={64} color={COLORS.primary} /></div>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-[#3390EC]/10 text-[#3390EC] shrink-0"><FileText size={16} /></div>
            <span className="text-[12px] leading-tight font-medium text-[#8E8E93]">Documents<br/>Analyzed</span>
          </div>
          <span className="text-[24px] font-bold text-white tracking-tight">14</span>
        </div>
        <div className="flex-1 rounded-2xl p-4 flex flex-col justify-center relative overflow-hidden backdrop-blur-md border border-white/5" style={{ backgroundColor: 'rgba(44, 44, 46, 0.6)' }}>
          <div className="absolute -right-3 -top-3 opacity-10"><MessageCircle size={64} color={COLORS.primary} /></div>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-[#3390EC]/10 text-[#3390EC] shrink-0"><MessageCircle size={16} /></div>
            <span className="text-[12px] leading-tight font-medium text-[#8E8E93]">Consultations</span>
          </div>
          <span className="text-[24px] font-bold text-white tracking-tight">32</span>
        </div>
      </div>

      {/* History List */}
      <div className="flex-1 bg-[#1C1C1D] flex flex-col relative pb-[80px]">
        <div className="px-4 pb-2 pt-1 flex items-center justify-between sticky top-0 bg-[#1C1C1D]/90 backdrop-blur-md z-10">
          <h3 className="text-[16px] font-semibold text-white">Recent Dialogues</h3>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {historyItems.map((item, index) => (
            <div 
              key={item.id} 
              onClick={() => navigate(`/chat/${item.id}`)}
              className={`flex items-center px-4 py-3 hover:bg-white/5 transition-colors cursor-pointer ${index !== historyItems.length - 1 ? 'border-b border-white/5' : ''}`}
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 mr-3" style={{ backgroundColor: COLORS.surface }}>
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

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 h-[64px] flex items-center justify-around border-t border-black/20 pb-2 backdrop-blur-xl z-50 max-w-md mx-auto" style={{ backgroundColor: 'rgba(28, 28, 29, 0.95)' }}>
        <button 
          onClick={() => navigate('/chat/new')}
          className="flex flex-col items-center justify-center w-16 gap-1 pt-1 text-[#8E8E93] hover:text-[#3390EC] transition-colors cursor-pointer"
        >
          <MessageCircle size={24} />
          <span className="text-[10px] font-medium">Chat</span>
        </button>
        <button className="flex flex-col items-center justify-center w-16 gap-1 pt-1 text-[#3390EC] cursor-pointer">
          <User size={24} className="fill-[#3390EC]/20" />
          <span className="text-[10px] font-medium">Profile</span>
        </button>
      </div>
    </div>
  );
}