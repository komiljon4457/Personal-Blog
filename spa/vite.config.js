import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// In dev the SPA runs at :5173 (base "/") and proxies API/CSS to the Express
// server on :3000. In production the app is built under "/app/" and served by
// Express itself (single port), so asset URLs are prefixed accordingly.
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/app/" : "/",
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:3000",
      "/graphql": "http://localhost:3000",
      "/css": "http://localhost:3000",
      "/assets": "http://localhost:3000",
    },
  },
}));
