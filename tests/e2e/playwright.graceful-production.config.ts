import { defineConfig, devices } from "@playwright/test";

/**
 * GR-82: a separately built Next.js production instance must already exist.
 * Do not let playwright.config.ts boot 'npm run dev' for release verification.
 */
const baseURL = process.env.GRACEFUL_PRODUCTION_BASE_URL;
if (!baseURL || !/^https?:\/\//.test(baseURL)) {
  throw new Error("GR-82 requires GRACEFUL_PRODUCTION_BASE_URL for a real production build");
}
export default defineConfig({
  testDir: ".",
  testMatch: ["graceful-production.spec.ts", "graceful-production-roles.spec.ts", "graceful-production-faults.spec.ts", "graceful-production-saves.spec.ts"],
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Intentionally no webServer. The orchestrator owns build + next start.
});
