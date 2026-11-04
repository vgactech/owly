import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: [
      "src/**/*.{test,spec}.{ts,tsx}",
      "packages/**/*.{test,spec}.{ts,tsx}",
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@sprites2d/schema": path.resolve(__dirname, "./packages/sprites2d-schema/src/index.ts"),
      "@sprites2d/character": path.resolve(__dirname, "./packages/sprites2d-character/src/index.ts"),
      "@sprites2d/quality": path.resolve(__dirname, "./packages/sprites2d-quality/src/index.ts"),
      "@sprites2d/ai/providers": path.resolve(__dirname, "./packages/sprites2d-ai/src/providers/index.ts"),
      "@sprites2d/ai": path.resolve(__dirname, "./packages/sprites2d-ai/src/providers/index.ts"),
      "@sprites2d/core": path.resolve(__dirname, "./packages/sprites2d-core/src/index.ts"),
    },
  },
});
