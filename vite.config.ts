import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa'; // 1. Импортируем плагин

export default defineConfig(({ mode }) => ({
  base: '/HFC/',
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    // 2. Настраиваем PWA
    VitePWA({
      registerType: 'autoUpdate', // Авто-обновление без лишних вопросов
      workbox: {
        cleanupOutdatedCaches: true, // Чистит старый кэш
        skipWaiting: true,           // Активирует новую версию мгновенно
        clientsClaim: true
      },
      manifest: {
        name: 'HFC Stats',
        short_name: 'HFC',
        description: 'Футбольная статистика HFC',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone', // Открывает как приложение
        icons: [
          {
            src: 'icon.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));