import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";


// https://vitejs.dev/config/
export default defineConfig({
  build: {
    minify: false,           // временно — чтобы увидеть читаемый CSS
    sourcemap: true,         // чтобы видеть связи с исходниками
    cssCodeSplit: false,     // объединит CSS в 1 файл (легче искать)
  },

  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
