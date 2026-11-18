import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// base "/v2/" so the build can be served by the existing server.js at badal.up.railway.app/v2
export default defineConfig({
  base: "/v2/",
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  build: { outDir: "dist", emptyOutDir: true },
});
