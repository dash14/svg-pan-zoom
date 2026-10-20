import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.js"],
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      instances: [{ browser: "chromium" }],
      // Wide enough for the 700x300 fixture, so that its whole area can be pointed at.
      viewport: { width: 1280, height: 720 },
    },
  },
});
