import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: '/', // added by me
  server: {
    host: 'localhost',
    port: Number(process.env.VITE_DEV_PORT ?? 8080),
    strictPort: false,
    // When dev server starts, open auth page instead of whatever
    // URL the browser last visited (avoids landing on broken /admin).
    open: '/auth',
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
