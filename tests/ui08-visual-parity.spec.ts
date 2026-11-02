/**
 * UI-08 P04: Visual parity test — TPO / HR CRM
 *
 * Playwright tests asserting page render, key string visibility, and screenshot
 * baseline for all surfaces in the UI-08 domain (TPO home, drives, companies,
 * students, calendar, team, reports, settings; HR invite flow).
 *
 * Standard: < 0.5% pixel variance at 1440×900 (desktop) and 375×812 (mobile).
 *
 * TPO and HR test accounts are NOT yet provisioned in the dev seed.
 * All TPO/HR tests are skipped until accounts are seeded:
 *   tpo@testa.42lms.com / Test@1234
 *   hr@testa.42lms.com  / Test@1234
 *
 * HR invite page is PUBLIC and requires a valid token — tested with stub URL only.
 */
import { test, expect, Page } from "@playwright/test";

const DEV_HOST =
  process.env.TEST_BASE_URL ||
  process.env.PLAYWRIGHT_BASE_URL ||
  "https://testa.development.42lms.com";

const DIFF_THRESHOLD = 0.005; // 0.5%

async function assertPageOk(page: Page): Promise<void> {
  await expect(page).not.toHaveURL(/\/login/);
  await expect(page.locator("body")).toBeVisible();
}

async function waitForContent(page: Page): Promise<void> {
  await page.waitForLoadState("networkidle");
}

// ---------------------------------------------------------------------------
// UI-08 — TPO SURFACES (all skipped — test account not provisioned)
// ---------------------------------------------------------------------------

test.describe("UI-08 Visual Parity — TPO surfaces", () => {
  test.skip("UI08-S01 TPO home page (TPO test account not provisioned)", async () => {
    // storageState: "tests/.auth/tpo.json"
    // await page.goto(`${DEV_HOST}/tpo`);
  });

  test.skip("UI08-S02 TPO students page (TPO test account not provisioned)", async () => {
    // storageState: "tests/.auth/tpo.json"
    // await page.goto(`${DEV_HOST}/tpo/students`);
  });

  test.skip("UI08-S03 TPO drives page (TPO test account not provisioned)", async () => {
    // storageState: "tests/.auth/tpo.json"
    // await page.goto(`${DEV_HOST}/tpo/drives`);
  });

  test.skip("UI08-S04 TPO companies page (TPO test account not provisioned)", async () => {
    // storageState: "tests/.auth/tpo.json"
    // await page.goto(`${DEV_HOST}/tpo/companies`);
  });

  test.skip("UI08-S05 TPO calendar page (TPO test account not provisioned)", async () => {
    // storageState: "tests/.auth/tpo.json"
    // await page.goto(`${DEV_HOST}/tpo/calendar`);
  });

  test.skip("UI08-S06 TPO team page (TPO test account not provisioned)", async () => {
    // storageState: "tests/.auth/tpo.json"
    // await page.goto(`${DEV_HOST}/tpo/team`);
  });

  test.skip("UI08-S07 TPO reports page (TPO test account not provisioned)", async () => {
    // storageState: "tests/.auth/tpo.json"
    // await page.goto(`${DEV_HOST}/tpo/reports`);
  });

  test.skip("UI08-S08 TPO settings page (TPO test account not provisioned)", async () => {
    // storageState: "tests/.auth/tpo.json"
    // await page.goto(`${DEV_HOST}/tpo/settings`);
  });
});

// ---------------------------------------------------------------------------
// UI-08 — RECRUITER SURFACES (all skipped — recruiter invite flow required)
// ---------------------------------------------------------------------------

test.describe("UI-08 Visual Parity — Recruiter surfaces", () => {
  test.skip("UI08-S20 recruiter today page (recruiter account requires invite)", async () => {
    // Recruiter accounts are created via the HR invite flow.
    // Must be provisioned before testing.
  });

  test.skip("UI08-S21 recruiter drives page (recruiter account requires invite)", async () => {
    // Same as above.
  });
});

// ---------------------------------------------------------------------------
// UI-08 — HR SURFACES (all skipped — test account not provisioned)
// ---------------------------------------------------------------------------

test.describe("UI-08 Visual Parity — HR surfaces", () => {
  test.skip("UI08-S30 HR home page (HR test account not provisioned)", async () => {
    // storageState: "tests/.auth/hr.json"
    // await page.goto(`${DEV_HOST}/hr`);
  });
});

// ---------------------------------------------------------------------------
// UI-08 — HR INVITE (PUBLIC — invalid token shows error state)
// ---------------------------------------------------------------------------

test.describe("UI-08 Visual Parity — HR invite (public)", () => {
  test("UI08-S40 HR invite page with invalid token shows error state", async ({ page }) => {
    // Using a stub token that is guaranteed to be invalid
    await page.goto(`${DEV_HOST}/hr-invite?token=invalid-token-for-parity-test`);
    await waitForContent(page);
    // The page must render (not crash); it may redirect to login or show error
    await expect(page.locator("body")).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui08/hr-invite-invalid-token.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui08-hr-invite-invalid-token.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });
});
