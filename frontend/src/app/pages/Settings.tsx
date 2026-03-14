// src/app/pages/Settings.tsx
import React from "react";
import { useNavigate } from "react-router";
import {
  ChevronLeft,
  Trash2,
  Bell,
  Moon,
  Info,
  ShieldCheck,
  LogOut,
} from "lucide-react";

export default function Settings() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen w-full bg-[#1C1C1D] text-white flex flex-col pb-10">
      {/* Header */}
      <div className="h-14 px-3 flex items-center border-b border-white/5 sticky top-0 bg-[#1C1C1D]/90 backdrop-blur-md z-10">
        <button
          onClick={() => navigate("/profile")}
          className="text-white p-1 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
        >
          <ChevronLeft size={28} />
        </button>
        <h2 className="ml-2 text-[17px] font-semibold">Settings</h2>
      </div>

      <div className="p-4 space-y-6">
        {/* Раздел: General */}
        <section>
          <h3 className="text-[#8E8E93] text-[13px] font-semibold uppercase tracking-wider ml-2 mb-2">
            General
          </h3>
          <div className="bg-[#2C2C2E] rounded-2xl overflow-hidden border border-white/5">
            <div className="flex items-center justify-between px-4 py-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <Moon size={20} className="text-white" />
                <span>Dark Mode</span>
              </div>
              <div className="w-10 h-6 bg-[#3390EC] rounded-full relative cursor-pointer">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
              </div>
            </div>
            <div className="flex items-center justify-between px-4 py-4">
              <div className="flex items-center gap-3">
                <Bell size={20} className="text-white" />
                <span>Notifications</span>
              </div>
              <div className="w-10 h-6 bg-[#3A3A3C] rounded-full relative cursor-pointer">
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full" />
              </div>
            </div>
          </div>
        </section>

        {/* Раздел: Data */}
        <section>
          <h3 className="text-[#8E8E93] text-[13px] font-semibold uppercase tracking-wider ml-2 mb-2">
            Data & Privacy
          </h3>
          <div className="bg-[#2C2C2E] rounded-2xl overflow-hidden border border-white/5">
            <button className="w-full flex items-center justify-between px-4 py-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer text-left">
              <div className="flex items-center gap-3 text-red-500">
                <Trash2 size={20} />
                <span>Clear All Chat History</span>
              </div>
            </button>
            <button className="w-full flex items-center justify-between px-4 py-4 hover:bg-white/5 transition-colors cursor-pointer text-left">
              <div className="flex items-center gap-3 text-white">
                <ShieldCheck size={20} />
                <span>Privacy Policy</span>
              </div>
            </button>
          </div>
        </section>

        {/* Раздел: About */}
        <section>
          <div className="bg-[#2C2C2E] rounded-2xl overflow-hidden border border-white/5">
            <button className="w-full flex items-center justify-between px-4 py-4 hover:bg-white/5 transition-colors cursor-pointer text-left">
              <div className="flex items-center gap-3 text-white">
                <Info size={20} />
                <span>About Legal Expert AI</span>
              </div>
            </button>
          </div>
        </section>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full py-4 text-red-500 font-medium bg-[#2C2C2E] rounded-2xl border border-red-500/10 hover:bg-red-500/10 transition-colors cursor-pointer flex items-center justify-center gap-2"
        >
          <LogOut size={20} />
          Sign Out
        </button>
      </div>
    </div>
  );
}
