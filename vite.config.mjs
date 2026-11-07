import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/womens-shootout/",
  build: {
    outDir: "dist",
  },
  optimizeDeps: {
    include: ["react", "react-dom/client"],
  },
  server: {
    open: "/womens-shootout/",
  },
  preview: {
    open: "/womens-shootout/",
  },
  plugins: [react()],
});
