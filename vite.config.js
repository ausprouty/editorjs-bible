import { defineConfig } from "vite";

export default defineConfig({
  server: {
    proxy: {
      "/api": {
        target: "https://api2.mylanguage.net.au",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});