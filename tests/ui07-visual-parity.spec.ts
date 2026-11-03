/**
 * UI-07 P04: Visual parity test — Placements (learner and admin)
 *
 * Playwright tests asserting page render, key string visibility, and screenshot
 * baseline for all surfaces in the UI-07 domain (placement drives, applications,
 * schedule, offers, notices, companies, interviews, analytics for admin).
 *
 * Standard: < 0.5% pixel variance at 1440×900 (desktop) and 375×812 (mobile).
 *
 * Learner account: learner@testa.42lms.com / Test@1234
 * Admin accounts: admin@testa.42lms.com, superadmin@testa.42lms.com / Test@1234
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
  const h1 = page.locator("h1");
  const h1Text = await h1.textContent().catch(() => "");
  expect((h1Text || "").toLowerCase()).not.toMatch(/^(404|not found)$/);
}

async function waitForContent(page: Page): Promise<void> {
  await page.waitForLoadState("networkidle");
}

// ---------------------------------------------------------------------------
// UI-07 — LEARNER PLACEMENT SURFACES
// ---------------------------------------------------------------------------

test.describe("UI-07 Visual Parity — Learner placements", () => {
  test.use({ storageState: "tests/.auth/learner.json" });

  test("UI07-S01 learner my placements home renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/learn/my-placements`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(page.locator("body")).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui07/learner-placements-home.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui07-learner-placements-home.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  test("UI07-S02 learner placement drives list renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/learn/my-placements/drives`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(page.locator("body")).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui07/learner-drives.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui07-learner-drives.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  test("UI07-S03 learner placement applications page renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/learn/my-placements/applications`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(page.locator("body")).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui07/learner-applications.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui07-learner-applications.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  test("UI07-S04 learner placement schedule page renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/learn/my-placements/schedule`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(page.locator("body")).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui07/learner-placement-schedule.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui07-learner-placement-schedule.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  test("UI07-S05 learner placement offers page renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/learn/my-placements/offers`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(page.locator("body")).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui07/learner-offers.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui07-learner-offers.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  test("UI07-S06 learner placement notices page renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/learn/my-placements/notices`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(page.locator("body")).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui07/learner-notices.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui07-learner-notices.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });
});

// ---------------------------------------------------------------------------
// UI-07 — ADMIN PLACEMENT SURFACES (superadmin)
// ---------------------------------------------------------------------------

test.describe("UI-07 Visual Parity — Admin placements", () => {
  test.use({ storageState: "tests/.auth/superadmin.json" });

  test("UI07-S20 admin placements drives list renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/admin/placements`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByRole("heading", { name: "Placement Drives" }).or(page.getByText("Placement Drives").first()).first()
    ).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui07/admin-placements.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui07-admin-placements.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  test("UI07-S21 admin placements companies renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/admin/placements/companies`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(page.locator("body")).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui07/admin-placement-companies.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui07-admin-placement-companies.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  test("UI07-S22 admin placements analytics renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/admin/placements/analytics`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(page.locator("body")).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui07/admin-placement-analytics.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui07-admin-placement-analytics.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });
});

// ---------------------------------------------------------------------------
// UI-07 — COLLEGE ADMIN PLACEMENT SURFACES
// ---------------------------------------------------------------------------

test.describe("UI-07 Visual Parity — College Admin placements", () => {
  test.use({ storageState: "tests/.auth/admin.json" });

  test("UI07-S30 college placements page renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/college/placements`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(page.locator("body")).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui07/college-placements.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui07-college-placements.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });
});

// ---------------------------------------------------------------------------
// UI-07 — MOBILE VIEWPORT
// ---------------------------------------------------------------------------

test.describe("UI-07 Visual Parity — placements mobile (375px)", () => {
  test.use({
    storageState: "tests/.auth/learner.json",
    viewport: { width: 375, height: 812 },
  });

  test("UI07-S01-mobile learner placements mobile layout", async ({ page }) => {
    await page.goto(`${DEV_HOST}/learn/my-placements`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(page).toHaveScreenshot("ui07-learner-placements-mobile.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });
});
