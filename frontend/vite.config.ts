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
    // Разрешаем подключение с твоего домена (защита от Host Header attacks в Vite 5+)
    allowedHosts: ["legal-assistant.kawun.su"],

    // Слушаем все сетевые интерфейсы внутри Docker/сервера на порту 5173
    host: "0.0.0.0",
    port: 5173,

    // Настройка горячей перезагрузки (HMR)
    hmr: {
      // Говорим браузеру подключаться по безопасному WebSocket через твой домен
      protocol: "wss",
      host: "legal-assistant.kawun.su",
      // Стандартный порт HTTPS (туннель сам перенаправит трафик на 5173)
      clientPort: 443,

      // Отключаем назойливый красный оверлей с ошибками в браузере
      overlay: false,
    },

    // Настройка наблюдателя (Chokidar)
    watch: {
      // Игнорируем все изменения на диске, КРОМЕ папки исходников фронтенда (src)
      // Это предотвращает перезагрузки, когда бэкенд сохраняет PDF/DOCX файлы
      ignored: ["!**/src/**"],

      // В Docker/WSL иногда ломается файловая система,
      // polling гарантирует, что Vite увидит изменения твоих tsx-файлов
      usePolling: true,
    },
  },
  assetsInclude: ["**/*.svg", "**/*.csv"],
});
