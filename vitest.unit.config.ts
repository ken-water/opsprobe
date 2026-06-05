import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: [
      "packages/**/*.unit.test.ts",
      "apps/**/*.unit.test.ts",
    ],
    coverage: {
      enabled: false,
    },
  },
});
