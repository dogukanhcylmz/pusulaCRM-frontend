import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// /api isteklerini C# backend'e yönlendirir (CORS gerekmez)
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { "/api": "http://localhost:5080" },
  },
});
