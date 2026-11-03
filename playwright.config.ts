import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  // Default directory for e2e tests (the original graceful suite)
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: process.env.E2E_PRODUCTION_SERVER === "true" ? "npm run start" : "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    // -----------------------------------------------------------------------
    // Original graceful / e2e suite (runs against local dev server)
    // -----------------------------------------------------------------------
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testDir: "./tests/e2e",
    },

    // -----------------------------------------------------------------------
    // P04 visual-parity auth setup — must run before visual-parity tests
    // Drives https://testa.development.42lms.com via the real OTP flow
    // (AUTH_TEST_OTP=135790, APP_ENV=development).
    // -----------------------------------------------------------------------
    {
      name: "visual-parity-setup",
      testDir: "./tests",
      testMatch: "auth.setup.ts",
      use: {
        ...devices["Desktop Chrome"],
        // No baseURL — specs use the full DEV_HOST URL directly
        baseURL: undefined,
      },
    },

    // -----------------------------------------------------------------------
    // P04 visual-parity specs (ui01…ui10)
    // Requires storage states produced by visual-parity-setup.
    // Runs against the deployed dev site; no local web server needed.
    // -----------------------------------------------------------------------
    {
      name: "visual-parity",
      testDir: "./tests",
      testMatch: "ui*-visual-parity.spec.ts",
      dependencies: ["visual-parity-setup"],
      // Remote dev server needs longer timeouts than the default 30s per test
      timeout: 120_000,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: undefined,
        actionTimeout: 30_000,
        navigationTimeout: 60_000,
      },
    },

    // -----------------------------------------------------------------------
    // P04 global regression gate
    // -----------------------------------------------------------------------
    {
      name: "visual-regression",
      testDir: "./tests",
      testMatch: "ui*-global-visual-regression.spec.ts",
      dependencies: ["visual-parity-setup"],
      timeout: 120_000,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: undefined,
        actionTimeout: 30_000,
        navigationTimeout: 60_000,
      },
    },
  ],
});
