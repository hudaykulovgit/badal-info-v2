import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import uzLatin from "./translit.js";

// uzLatin() turns the Uzbek Cyrillic UI and data into Uzbek Latin at build time (Russian landing copy kept).
// Relative base: the build works at the site root (Vercel) and under /v2 (Railway server.js).
export default defineConfig({
  base: "./",
  plugins: [uzLatin(), react()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  build: { outDir: "dist", emptyOutDir: true },
});
