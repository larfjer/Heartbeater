import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  base: "./",
  root: ".",
  build: {
    outDir: "dist/renderer",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      "@renderer": resolve(__dirname, "src/renderer"),
      "@components": resolve(__dirname, "src/renderer/components"),
      "@hooks": resolve(__dirname, "src/renderer/hooks"),
      "@pages": resolve(__dirname, "src/renderer/pages"),
      "@types": resolve(__dirname, "src/types"),
    },
  },
  server: {
    port: 5173,
  },
});
