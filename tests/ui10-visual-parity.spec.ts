/**
 * UI-10 P04: Global visual regression gate
 * Cross-milestone Playwright smoke test: one representative surface per milestone.
 * Standard: < 0.5% pixel variance at 1440x900.
 * All 9 domains verified in one run.
 */
import { test, expect } from "@playwright/test";

const BASE_URL =
  process.env.TEST_BASE_URL ||
  process.env.PLAYWRIGHT_BASE_URL ||
  "https://testa.development.42lms.com";

const DIFF_THRESHOLD = 0.005;

test.describe("UI-10 global gate — representative surface smoke tests", () => {
  test("UI-01 auth: login page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toBeVisible();
    await expect(page).toHaveScreenshot("ui01-login.png", { maxDiffRatio: DIFF_THRESHOLD });
  });

  test("UI-02 academics: batches page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/college/batches`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toBeVisible();
    await expect(page).toHaveScreenshot("ui02-batches.png", { maxDiffRatio: DIFF_THRESHOLD });
  });

  test("UI-03 profiles: learner profile loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/learn/profile`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toBeVisible();
    await expect(page).toHaveScreenshot("ui03-profile.png", { maxDiffRatio: DIFF_THRESHOLD });
  });

  test("UI-04 courses: admin courses list loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/courses`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toBeVisible();
    await expect(page).toHaveScreenshot("ui04-courses.png", { maxDiffRatio: DIFF_THRESHOLD });
  });

  test("UI-05 assignments: admin assignments list loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/assignments`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toBeVisible();
    await expect(page).toHaveScreenshot("ui05-assignments.png", { maxDiffRatio: DIFF_THRESHOLD });
  });

  test("UI-06 projects: admin projects list loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/projects`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toBeVisible();
    await expect(page).toHaveScreenshot("ui06-projects.png", { maxDiffRatio: DIFF_THRESHOLD });
  });

  test("UI-07 placements: learner placements loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/learn/my-placements`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toBeVisible();
    await expect(page).toHaveScreenshot("ui07-placements.png", { maxDiffRatio: DIFF_THRESHOLD });
  });

  test("UI-08 tpo: TPO dashboard loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/tpo`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toBeVisible();
    await expect(page).toHaveScreenshot("ui08-tpo.png", { maxDiffRatio: DIFF_THRESHOLD });
  });

  test("UI-09 notifications: notifications page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/learn/notifications`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toBeVisible();
    await expect(page).toHaveScreenshot("ui09-notifications.png", { maxDiffRatio: DIFF_THRESHOLD });
  });
});
