import { defineConfig } from "vite";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    allowedHosts: ["legal-assistant.kawun.su"],
    // 👇 ДОБАВЬ ЭТОТ БЛОК 👇
    hmr: {
      // Это запретит Vite перезагружать страницу при ошибках HMR-сокета
      overlay: false,
    },
    // Отключаем наблюдение за файлами, если они не меняются,
    // чтобы снизить нагрузку на туннель
    watch: {
      usePolling: false,
    },
  },
  assetsInclude: ["**/*.svg", "**/*.csv"],
});
