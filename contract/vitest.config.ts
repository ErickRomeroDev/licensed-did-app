import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["src/test/**/*.test.ts"],
    testTimeout: 120_000,
    hookTimeout: 120_000,
  },
  resolve: {
    conditions: ["import", "node", "default"],
    extensions: [".ts", ".js"],
  },
});
