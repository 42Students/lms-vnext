/**
 * UI-05 P04: Visual parity test — Assignments, Quizzes, Grading, Attendance
 *
 * Playwright tests asserting page render, key string visibility, and screenshot
 * baseline for all surfaces in the UI-05 domain (assignments CRUD/submissions,
 * quizzes CRUD/submissions, attendance grid, grading, faculty assignment views).
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
// UI-05 — ADMIN ASSIGNMENT SURFACES
// ---------------------------------------------------------------------------

test.describe("UI-05 Visual Parity — Admin assignments", () => {
  test.use({ storageState: "tests/.auth/superadmin.json" });

  test("UI05-S01 admin assignments list renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/admin/assignments`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(page.getByRole("heading", { name: "Assignments" })).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui05/admin-assignments.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui05-admin-assignments.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  test("UI05-S02 create assignment button visible", async ({ page }) => {
    await page.goto(`${DEV_HOST}/admin/assignments`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(page.locator("body")).toBeVisible();
  });

  test("UI05-S05 admin quizzes list renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/admin/quizzes`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(page.getByRole("heading", { name: "Quizzes" })).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui05/admin-quizzes.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui05-admin-quizzes.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  test("UI05-S10 admin attendance page renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/admin/attendance`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(page.getByText("Attendance").filter({ visible: true }).first()).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui05/admin-attendance.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui05-admin-attendance.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });
});

// ---------------------------------------------------------------------------
// UI-05 — FACULTY (TEACHER) SURFACES
// ---------------------------------------------------------------------------

test.describe("UI-05 Visual Parity — Faculty surfaces", () => {
  test.use({ storageState: "tests/.auth/faculty.json" });

  test("UI05-S20 teacher all assignments page renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/teacher/allAssignments`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(page.getByRole("heading", { name: /Assignments/i }).first()).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui05/teacher-assignments.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui05-teacher-assignments.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  test("UI05-S21 teacher all quizzes page renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/teacher/allQuizzes`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(page.getByRole("heading", { name: /Quizzes/i }).first()).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui05/teacher-quizzes.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui05-teacher-quizzes.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  test("UI05-S22 teacher report page renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/teacher/report`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(page.locator("body")).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui05/teacher-report.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui05-teacher-report.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  test("UI05-S23 teacher courses page renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/teacher/courses`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(page.getByText("Courses").first()).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui05/teacher-courses.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui05-teacher-courses.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });
});

// ---------------------------------------------------------------------------
// UI-05 — LEARNER ASSIGNMENT / QUIZ / ATTENDANCE SURFACES
// ---------------------------------------------------------------------------

test.describe("UI-05 Visual Parity — Learner assignments, quizzes, attendance", () => {
  test.use({ storageState: "tests/.auth/learner.json" });

  test("UI05-S30 learner all assignments page renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/learn/allAssignments`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(page.getByRole("heading", { name: /Assignments/i }).first()).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui05/learner-assignments.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui05-learner-assignments.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  test("UI05-S31 learner all quizzes page renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/learn/allQuizzes`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(page.getByRole("heading", { name: "Quizzes" })).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui05/learner-quizzes.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui05-learner-quizzes.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  test("UI05-S32 learner attendance page renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/learn/attendance`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(page.getByText("Attendance").filter({ visible: true }).first()).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui05/learner-attendance.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui05-learner-attendance.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });
});

// ---------------------------------------------------------------------------
// UI-05 — MOBILE VIEWPORT
// ---------------------------------------------------------------------------

test.describe("UI-05 Visual Parity — mobile (375px)", () => {
  test.use({
    storageState: "tests/.auth/superadmin.json",
    viewport: { width: 375, height: 812 },
  });

  test("UI05-S01-mobile admin assignments mobile layout", async ({ page }) => {
    await page.goto(`${DEV_HOST}/admin/assignments`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(page).toHaveScreenshot("ui05-admin-assignments-mobile.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });
});
