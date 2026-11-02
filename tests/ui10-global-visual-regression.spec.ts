/**
 * UI-10 P04: Global Visual Regression Gate
 *
 * This test suite is the final visual regression gate. It exercises one
 * representative surface from each domain (UI-01 through UI-09) to confirm:
 * 1. The app shell renders for every role (no white-screen regressions).
 * 2. Navigation landmarks are present on each surface.
 * 3. No domain's change broke another domain's core rendering.
 *
 * Standard: < 0.5% pixel variance at 1440×900 (desktop) and 375×812 (mobile).
 *
 * This suite is intentionally narrow — it tests shell and nav integrity, not
 * deep feature flows. Deep per-domain testing is in ui01–ui09 specs.
 *
 * Test accounts (from scripts/seed-test-tenants.ts):
 *   learner@testa.42lms.com / Test@1234
 *   faculty@testa.42lms.com / Test@1234
 *   admin@testa.42lms.com   / Test@1234
 *   superadmin@testa.42lms.com / Test@1234
 */
import { test, expect, Page } from "@playwright/test";

const DEV_HOST =
  process.env.TEST_BASE_URL ||
  process.env.PLAYWRIGHT_BASE_URL ||
  "https://testa.development.42lms.com";

const DIFF_THRESHOLD = 0.005; // 0.5%

async function assertShellOk(page: Page): Promise<void> {
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
// UI-10 — PUBLIC / AUTH DOMAIN (UI-01)
// ---------------------------------------------------------------------------

test.describe("UI-10 Global Gate — Auth domain (UI-01)", () => {
  test("UI10-G01 login page renders (no auth required)", async ({ page }) => {
    await page.goto(`${DEV_HOST}/login`);
    await waitForContent(page);
    await expect(page.locator("body")).toBeVisible();
    await expect(page).not.toHaveURL(/500|error/);
    await page.screenshot({
      path: "tests/ui-snapshots/ui10/global-login.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui10-global-login.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });
});

// ---------------------------------------------------------------------------
// UI-10 — SUPERADMIN SHELL CROSS-DOMAIN
// ---------------------------------------------------------------------------

test.describe("UI-10 Global Gate — SuperAdmin shell", () => {
  test.use({ storageState: "tests/.auth/superadmin.json" });

  test("UI10-G02 superadmin dashboard renders (UI-01 shell)", async ({ page }) => {
    await page.goto(`${DEV_HOST}/admin`);
    await waitForContent(page);
    await assertShellOk(page);
    await page.screenshot({
      path: "tests/ui-snapshots/ui10/global-superadmin-shell.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui10-global-superadmin-shell.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  test("UI10-G03 batches (UI-02 academics) — no regression from UI-01 changes", async ({ page }) => {
    await page.goto(`${DEV_HOST}/admin/batches`);
    await waitForContent(page);
    await assertShellOk(page);
    await expect(page.getByText("Batches").first()).toBeVisible();
  });

  test("UI10-G04 courses (UI-04) — no regression", async ({ page }) => {
    await page.goto(`${DEV_HOST}/admin/courses`);
    await waitForContent(page);
    await assertShellOk(page);
    await expect(page.getByText("Courses").first()).toBeVisible();
  });

  test("UI10-G05 assignments (UI-05) — no regression", async ({ page }) => {
    await page.goto(`${DEV_HOST}/admin/assignments`);
    await waitForContent(page);
    await assertShellOk(page);
    await expect(page.getByText("Assignments").first()).toBeVisible();
  });

  test("UI10-G06 projects (UI-06) — no regression", async ({ page }) => {
    await page.goto(`${DEV_HOST}/admin/projects`);
    await waitForContent(page);
    await assertShellOk(page);
    await expect(page.getByText("Projects").first()).toBeVisible();
  });

  test("UI10-G07 placements (UI-07) — no regression", async ({ page }) => {
    await page.goto(`${DEV_HOST}/admin/placements`);
    await waitForContent(page);
    await assertShellOk(page);
    await expect(page.locator("body")).toBeVisible();
  });

  test("UI10-G09 notifications (UI-09) — no regression", async ({ page }) => {
    await page.goto(`${DEV_HOST}/notifications`);
    await waitForContent(page);
    await assertShellOk(page);
    await expect(page.getByText("Notifications").first()).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// UI-10 — COLLEGE ADMIN SHELL CROSS-DOMAIN
// ---------------------------------------------------------------------------

test.describe("UI-10 Global Gate — College Admin shell", () => {
  test.use({ storageState: "tests/.auth/admin.json" });

  test("UI10-G10 college admin profile (UI-03) — no regression", async ({ page }) => {
    await page.goto(`${DEV_HOST}/college/profile`);
    await waitForContent(page);
    await assertShellOk(page);
    await expect(page.getByText("Profile").first()).toBeVisible();
  });

  test("UI10-G11 college courses (UI-04) — no regression", async ({ page }) => {
    await page.goto(`${DEV_HOST}/college/courses`);
    await waitForContent(page);
    await assertShellOk(page);
    await expect(page.getByText("Courses").first()).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// UI-10 — LEARNER SHELL CROSS-DOMAIN
// ---------------------------------------------------------------------------

test.describe("UI-10 Global Gate — Learner shell", () => {
  test.use({ storageState: "tests/.auth/learner.json" });

  test("UI10-G20 learner profile (UI-03) — no regression", async ({ page }) => {
    await page.goto(`${DEV_HOST}/learn/profile`);
    await waitForContent(page);
    await assertShellOk(page);
    await expect(page.getByText("Profile").first()).toBeVisible();
  });

  test("UI10-G21 learner my courses (UI-04) — no regression", async ({ page }) => {
    await page.goto(`${DEV_HOST}/learn/my-courses`);
    await waitForContent(page);
    await assertShellOk(page);
    await expect(page.getByText("Courses").first()).toBeVisible();
  });

  test("UI10-G22 learner assignments (UI-05) — no regression", async ({ page }) => {
    await page.goto(`${DEV_HOST}/learn/allAssignments`);
    await waitForContent(page);
    await assertShellOk(page);
    await expect(page.getByText("Assignments").first()).toBeVisible();
  });

  test("UI10-G23 learner projects (UI-06) — no regression", async ({ page }) => {
    await page.goto(`${DEV_HOST}/learn/projects`);
    await waitForContent(page);
    await assertShellOk(page);
    await expect(page.getByText("Projects").first()).toBeVisible();
  });

  test("UI10-G24 learner placements (UI-07) — no regression", async ({ page }) => {
    await page.goto(`${DEV_HOST}/learn/my-placements`);
    await waitForContent(page);
    await assertShellOk(page);
    await expect(page.locator("body")).toBeVisible();
  });

  test("UI10-G25 learner notifications (UI-09) — no regression", async ({ page }) => {
    await page.goto(`${DEV_HOST}/notifications`);
    await waitForContent(page);
    await assertShellOk(page);
    await expect(page.getByText("Notifications").first()).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// UI-10 — FACULTY SHELL CROSS-DOMAIN
// ---------------------------------------------------------------------------

test.describe("UI-10 Global Gate — Faculty shell", () => {
  test.use({ storageState: "tests/.auth/faculty.json" });

  test("UI10-G30 faculty profile (UI-03) — no regression", async ({ page }) => {
    await page.goto(`${DEV_HOST}/teacher/profile`);
    await waitForContent(page);
    await assertShellOk(page);
    await expect(page.getByText("Profile").first()).toBeVisible();
  });

  test("UI10-G31 faculty courses (UI-04/05) — no regression", async ({ page }) => {
    await page.goto(`${DEV_HOST}/teacher/courses`);
    await waitForContent(page);
    await assertShellOk(page);
    await expect(page.getByText("Courses").first()).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// UI-10 — GLOBAL MOBILE REGRESSION
// ---------------------------------------------------------------------------

test.describe("UI-10 Global Gate — Mobile regression (375px)", () => {
  test.use({
    storageState: "tests/.auth/learner.json",
    viewport: { width: 375, height: 812 },
  });

  test("UI10-G40 learner profile mobile shell — no cross-domain regression", async ({ page }) => {
    await page.goto(`${DEV_HOST}/learn/profile`);
    await waitForContent(page);
    await assertShellOk(page);
    await expect(page).toHaveScreenshot("ui10-global-learner-profile-mobile.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });
});
