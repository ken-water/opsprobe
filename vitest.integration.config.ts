import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: [
      "packages/**/*.integration.test.ts",
      "apps/**/*.integration.test.ts",
    ],
    testTimeout: 20000,
    hookTimeout: 20000,
    coverage: {
      enabled: false,
    },
  },
});
