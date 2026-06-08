import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["src/**/*.ui.test.tsx"],
    testTimeout: 20000,
    hookTimeout: 20000,
    coverage: {
      enabled: false,
    },
  },
});
