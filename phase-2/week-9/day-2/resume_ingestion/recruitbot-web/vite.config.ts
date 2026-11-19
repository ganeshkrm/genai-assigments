import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    // Ensure single instances — React (framer-motion / radix use React context)
    // and react-router (a duplicated router context renders a blank page in the
    // production build).
    dedupe: ["react", "react-dom", "react-router", "react-router-dom"],
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "framer-motion",
      "react-router-dom",
    ],
  },
  server: {
    port: 5173,
  },
});
