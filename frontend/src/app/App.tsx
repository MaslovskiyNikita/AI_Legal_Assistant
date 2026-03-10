import React from "react";
import { BrowserRouter, Routes, Route } from "react-router";

import Welcome from "./pages/Welcome";
import Profile from "./pages/Profile";
import Chat from "./pages/Chat";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-black flex justify-center font-sans">
        <div className="w-full max-w-md bg-[#1C1C1D] relative shadow-2xl overflow-hidden">
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/chat/:chatId" element={<Chat />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}