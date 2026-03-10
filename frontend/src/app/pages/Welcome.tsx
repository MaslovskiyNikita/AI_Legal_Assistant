import React from "react";
import { Scale, Shield, Folder } from "lucide-react";
import { useNavigate } from "react-router";

const COLORS = {
  bg: "#1C1C1D",
  primary: "#3390EC",
  textPrimary: "#FFFFFF",
};

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full relative overflow-hidden flex flex-col" style={{ backgroundColor: COLORS.bg }}>
      {/* Background Abstract Area */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1C1C1D] via-[#151D2A] to-[#1C1C1D] overflow-hidden">
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

      {/* Bottom Modal */}
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
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-white" />
            <div className="w-2 h-2 rounded-full bg-[#4A4A4C]" />
            <div className="w-2 h-2 rounded-full bg-[#4A4A4C]" />
            <div className="w-2 h-2 rounded-full bg-[#4A4A4C]" />
          </div>

          <button 
            onClick={() => navigate('/profile')}
            className="w-full py-3.5 rounded-xl font-semibold text-[17px] text-white transition-opacity active:opacity-80 z-10 relative cursor-pointer"
            style={{ backgroundColor: COLORS.primary }}
          >
            Let's Go!
          </button>
        </div>
      </div>
    </div>
  );
}