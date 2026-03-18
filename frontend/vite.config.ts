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
    hmr: {
      overlay: false,
    },
    watch: {
      usePolling: false,
      ignored: ["!**/src/**"],
    },
  },
  assetsInclude: ["**/*.svg", "**/*.csv"],
});
