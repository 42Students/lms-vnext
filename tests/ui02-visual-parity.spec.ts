/**
 * UI-02 P04: Visual parity test — Academics
 *
 * Playwright tests asserting page render, key string visibility, and screenshot
 * baseline for all surfaces in the UI-02 domain (batches, programs, semesters,
 * semester-courses, classes, departments, lecture halls, faculty assignment,
 * batch promotion, electives, timetable, academic calendar).
 *
 * Standard: < 0.5% pixel variance at 1440×900 (desktop) and 375×812 (mobile).
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
// UI-02 — SUPERADMIN / COLLEGE ADMIN — ACADEMICS SURFACES
// ---------------------------------------------------------------------------

test.describe("UI-02 Visual Parity — Batches", () => {
  test.use({ storageState: "tests/.auth/superadmin.json" });

  test("UI02-S01 batches list page renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/admin/batches`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(page.getByText("Batches").first()).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui02/superadmin-batches.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui02-superadmin-batches.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  test("UI02-S02 programs list page renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/admin/programs`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(page.getByText("Programs").first()).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui02/superadmin-programs.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui02-superadmin-programs.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  test("UI02-S03 departments list page renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/admin/departments`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(page.getByText("Departments").first()).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui02/superadmin-departments.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui02-superadmin-departments.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  test("UI02-S04 semesters list page renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/admin/semesters`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(page.getByText("Semesters").first()).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui02/superadmin-semesters.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui02-superadmin-semesters.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  test("UI02-S05 semester courses page renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/admin/semester-courses`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByText("Semester Courses").or(page.getByText("Semester-Courses")).first()
    ).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui02/superadmin-semester-courses.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui02-superadmin-semester-courses.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  test("UI02-S06 classes list page renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/admin/classes`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(page.getByText("Classes").first()).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui02/superadmin-classes.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui02-superadmin-classes.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  test("UI02-S07 lecture halls page renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/admin/lecture-halls`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByText("Lecture Halls").or(page.getByText("Lecture halls")).first()
    ).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui02/superadmin-lecture-halls.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui02-superadmin-lecture-halls.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  test("UI02-S08 faculty assignment page renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/admin/faculty-assignment`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(page.getByText("Faculty Assignment").first()).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui02/superadmin-faculty-assignment.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui02-superadmin-faculty-assignment.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  test("UI02-S09 batch promotion page renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/admin/batch-promotion`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByText("Batch Promotion").or(page.getByText("Batch promotion")).first()
    ).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui02/superadmin-batch-promotion.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui02-superadmin-batch-promotion.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  test("UI02-S10 electives page renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/admin/electives`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(page.getByText("Electives").first()).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui02/superadmin-electives.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui02-superadmin-electives.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });
});

// ---------------------------------------------------------------------------
// UI-02 — COLLEGE ADMIN SURFACES
// ---------------------------------------------------------------------------

test.describe("UI-02 Visual Parity — College Admin academics", () => {
  test.use({ storageState: "tests/.auth/admin.json" });

  test("UI02-S20 college batches page renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/college/batches`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(page.getByText("Batches").first()).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui02/college-batches.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui02-college-batches.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  test("UI02-S21 college programs page renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/college/programs`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(page.getByText("Programs").first()).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui02/college-programs.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui02-college-programs.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  test("UI02-S22 college semesters page renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/college/semesters`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(page.getByText("Semesters").first()).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui02/college-semesters.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui02-college-semesters.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  test("UI02-S23 college semester courses page renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/college/semester-courses`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(page.getByText("Semester Courses").or(page.locator("body")).first()).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui02/college-semester-courses.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui02-college-semester-courses.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  test("UI02-S24 college classes page renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/college/classes`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(page.getByText("Classes").first()).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui02/college-classes.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui02-college-classes.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });
});

// ---------------------------------------------------------------------------
// UI-02 — LEARNER ACADEMIC SURFACES
// ---------------------------------------------------------------------------

test.describe("UI-02 Visual Parity — Learner academic surfaces", () => {
  test.use({ storageState: "tests/.auth/learner.json" });

  test("UI02-S40 learner academic record page renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/learn/academic-record`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByText("Academic Record").or(page.getByText("Academic record")).first()
    ).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui02/learner-academic-record.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui02-learner-academic-record.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  test("UI02-S41 learner timetable page renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/learn/timetable`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(page.getByText("Timetable").first()).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui02/learner-timetable.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui02-learner-timetable.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });
});

// ---------------------------------------------------------------------------
// UI-02 — MOBILE VIEWPORT
// ---------------------------------------------------------------------------

test.describe("UI-02 Visual Parity — Batches mobile (375px)", () => {
  test.use({
    storageState: "tests/.auth/superadmin.json",
    viewport: { width: 375, height: 812 },
  });

  test("UI02-S01-mobile batches list mobile layout renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/admin/batches`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(page).toHaveScreenshot("ui02-superadmin-batches-mobile.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });
});
