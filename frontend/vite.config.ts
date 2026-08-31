import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Any request starting with /api gets forwarded to the backend.
      // The frontend code can just use fetch("/api/auth/login") instead
      // of hardcoding http://localhost:3000 everywhere.
      "/api": "http://localhost:3000",
    },
  },
});
