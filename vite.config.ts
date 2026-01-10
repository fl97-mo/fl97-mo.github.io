import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  base: "/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    proxy: {
      "/audio": {
        target: "https://audio.fl97-mo.de",
        changeOrigin: true,
        secure: true,
        rewrite: (p) => p.replace(/^\/audio/, ""),
      },
    },
  },
});
