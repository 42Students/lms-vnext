/**
 * UI-07 P04: Visual parity test — Placements (Learner + Admin)
 *
 * Playwright tests asserting page render, key string visibility, and screenshot
 * baseline for all 55 surfaces in the UI-07 domain (placements-learner-admin).
 *
 * Standard: < 0.5% pixel variance at 1440×900 (desktop) and 375×812 (mobile).
 *
 * Test accounts (from scripts/seed-test-tenants.ts):
 *   learner@testa.42lms.com / Test@1234
 *   admin@testa.42lms.com   / Test@1234
 *
 * Surfaces needing test.skip:
 *   - Dynamic-route surfaces ([jobId], [applicationId]) — require a seeded ID from the running dev DB
 *   - TPO role — test account not yet provisioned in dev seed
 *   - Transient states (loading/error) — require API mocking, out of scope for P04 baseline
 *   - Confirm / popconfirm dialogs — require preceding list-page row interaction
 */
import { test, expect, Page } from "@playwright/test";

const DEV_HOST =
  process.env.TEST_BASE_URL ||
  process.env.PLAYWRIGHT_BASE_URL ||
  "https://testa.development.42lms.com";

const DIFF_THRESHOLD = 0.005; // 0.5%

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function assertPageOk(page: Page): Promise<void> {
  // Must not redirect to login
  await expect(page).not.toHaveURL(/\/login/);
  // Body must be visible (no blank white screen)
  await expect(page.locator("body")).toBeVisible();
  // Must not show a hard 404 heading
  const h1 = page.locator("h1");
  const h1Text = await h1.textContent().catch(() => "");
  expect((h1Text || "").toLowerCase()).not.toMatch(/^(404|not found)$/);
}

async function waitForContent(page: Page): Promise<void> {
  await page.waitForLoadState("networkidle");
}

// ---------------------------------------------------------------------------
// UI-07 — LEARNER PLACEMENTS SURFACES
// ---------------------------------------------------------------------------

test.describe("UI-07 Visual Parity — Learner Placements surfaces", () => {
  test.use({ storageState: "tests/.auth/learner.json" });

  // UI07-S01: Learner — My Placements: Home
  test("UI07-S01 learner my-placements home renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/learn/my-placements`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByRole("heading", { name: "My Placements" }).or(page.getByText("My Placements").first())
    ).toBeVisible();
    // S52 nav tabs verified here
    await expect(page.getByText("Home").first()).toBeVisible();
    await expect(page.getByText("Drives").first()).toBeVisible();
    await expect(page.getByText("Applications").first()).toBeVisible();
    // S55 debarment notice: if present, key string must match
    // (not required for all accounts — just validate the page renders correctly)
    await page.screenshot({
      path: "tests/ui-snapshots/ui07/learner-my-placements-home.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui07-learner-my-placements-home.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI07-S02: Learner — My Placements: All Applications
  test("UI07-S02 learner applications list renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/learn/my-placements/applications`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByRole("heading", { name: "Applications" }).or(page.getByText("Applications").first())
    ).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui07/learner-applications.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui07-learner-applications.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI07-S03: Learner — My Placements: Application detail — dynamic route; skip
  test.skip("UI07-S03 learner application detail (dynamic route — requires seeded applicationId)", async () => {
    // Replace APPLICATION_ID with an actual ID from the dev DB seed.
    // await page.goto(`${DEV_HOST}/learn/my-placements/applications/APPLICATION_ID`);
  });

  // UI07-S04: Learner — My Placements: Announcements
  test("UI07-S04 learner placements announcements renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/learn/my-placements/announcements`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByRole("heading", { name: "Announcements" }).or(page.getByText("Announcements").first())
    ).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui07/learner-announcements.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui07-learner-announcements.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI07-S05: Learner — My Placements: Assessments
  test("UI07-S05 learner placements assessments renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/learn/my-placements/assessments`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByRole("heading", { name: "Assessments" }).or(page.getByText("Assessments").first())
    ).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui07/learner-assessments.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui07-learner-assessments.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI07-S06: Learner — My Placements: Calendar
  test("UI07-S06 learner placements calendar renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/learn/my-placements/calendar`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByRole("heading", { name: "Calendar" }).or(page.getByText("Calendar").first())
    ).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui07/learner-calendar.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui07-learner-calendar.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI07-S07: Learner — My Placements: Interview slots
  test("UI07-S07 learner interviews list renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/learn/my-placements/interviews`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByRole("heading", { name: "Interviews" }).or(page.getByText("Interviews").first())
    ).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui07/learner-interviews.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui07-learner-interviews.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI07-S08: Learner — My Placements: Drives list
  test("UI07-S08 learner drives list renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/learn/my-placements/jobs`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByRole("heading", { name: "Drives" }).or(page.getByText("Drives").first())
    ).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui07/learner-drives.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui07-learner-drives.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI07-S09: Learner — My Placements: Drive detail — dynamic route; skip
  test.skip("UI07-S09 learner drive detail (dynamic route — requires seeded jobId)", async () => {
    // Replace JOB_ID with an actual ID from the dev DB seed.
    // await page.goto(`${DEV_HOST}/learn/my-placements/jobs/JOB_ID`);
  });

  // UI07-S10: Learner — My Placements: Notification preferences
  test("UI07-S10 learner notification preferences renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/learn/my-placements/notification-preferences`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByRole("heading", { name: "Notification Preferences" }).or(page.getByText("Notification Preferences").first())
    ).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui07/learner-notification-preferences.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui07-learner-notification-preferences.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI07-S11: Learner — My Placements: Offers
  test("UI07-S11 learner offers list renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/learn/my-placements/offers`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByRole("heading", { name: "Offers" }).or(page.getByText("Offers").first())
    ).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui07/learner-offers.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui07-learner-offers.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI07-S12: Learner — My Placements: Preparation
  test("UI07-S12 learner placement preparation renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/learn/my-placements/preparation`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByRole("heading", { name: "Preparation" }).or(page.getByText("Preparation").first())
    ).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui07/learner-preparation.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui07-learner-preparation.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI07-S13: Learner — My Placements: Placement rules
  test("UI07-S13 learner placement rules renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/learn/my-placements/rules`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByRole("heading", { name: "Placement Rules" }).or(page.getByText("Placement Rules").first())
    ).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui07/learner-placement-rules.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui07-learner-placement-rules.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI07-S14: Learner — My Placements: Schedule
  test("UI07-S14 learner placement schedule renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/learn/my-placements/schedule`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByRole("heading", { name: "Schedule" }).or(page.getByText("Schedule").first())
    ).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui07/learner-schedule.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui07-learner-schedule.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI07-S15: Learner — My Placements: Support
  test("UI07-S15 learner placement support renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/learn/my-placements/support`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByRole("heading", { name: "Support" }).or(page.getByText("Support").first())
    ).toBeVisible();
    await expect(page.getByText("Placement cell").first()).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui07/learner-support.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui07-learner-support.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI07-S16: Learner — Placements overview (public listing)
  test("UI07-S16 learner placements overview renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/learn/placements`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByRole("heading", { name: "Placements" }).or(page.getByText("Placements").first())
    ).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui07/learner-placements-overview.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui07-learner-placements-overview.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });
});

// ---------------------------------------------------------------------------
// UI-07 — LEARNER PLACEMENTS — MOBILE VIEWPORT
// ---------------------------------------------------------------------------

test.describe("UI-07 Visual Parity — Learner Placements (mobile 375px)", () => {
  test.use({
    storageState: "tests/.auth/learner.json",
    viewport: { width: 375, height: 812 },
  });

  test("UI07-S01-mobile learner my-placements home mobile layout renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/learn/my-placements`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(page).toHaveScreenshot("ui07-learner-my-placements-home-mobile.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });
});

// ---------------------------------------------------------------------------
// UI-07 — ADMIN PLACEMENTS SURFACES
// ---------------------------------------------------------------------------

test.describe("UI-07 Visual Parity — Admin Placements surfaces", () => {
  test.use({ storageState: "tests/.auth/admin.json" });

  // UI07-S17: Admin — Placements: Home/Dashboard
  test("UI07-S17 admin placements dashboard renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/admin/placements`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByRole("heading", { name: "Placements" }).or(page.getByText("Placements").first())
    ).toBeVisible();
    // S53 admin nav tabs verified here
    await expect(page.getByText("Drives").first()).toBeVisible();
    await expect(page.getByText("Companies").first()).toBeVisible();
    await expect(page.getByText("Interviews").first()).toBeVisible();
    await expect(page.getByText("Analytics").first()).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui07/admin-placements-dashboard.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui07-admin-placements-dashboard.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI07-S18: Admin — Placements: Analytics
  test("UI07-S18 admin placements analytics renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/admin/placements/analytics`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByRole("heading", { name: "Analytics" }).or(page.getByText("Analytics").first())
    ).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui07/admin-placements-analytics.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui07-admin-placements-analytics.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI07-S19: Admin — Placements: Applications list
  test("UI07-S19 admin placements applications list renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/admin/placements/applications`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByRole("heading", { name: "Applications" }).or(page.getByText("Applications").first())
    ).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui07/admin-applications.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui07-admin-applications.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI07-S20: Admin — Placements: Calendar
  test("UI07-S20 admin placements calendar renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/admin/placements/calendar`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByRole("heading", { name: "Calendar" }).or(page.getByText("Calendar").first())
    ).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui07/admin-calendar.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui07-admin-calendar.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI07-S21: Admin — Placements: Drives list
  test("UI07-S21 admin placements drives list renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/admin/placements/drives`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByRole("heading", { name: "Drives" }).or(page.getByText("Drives").first())
    ).toBeVisible();
    await expect(page.getByText("New Drive").first()).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui07/admin-drives.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui07-admin-drives.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI07-S22: Admin — Placements: Hiring dashboard
  test("UI07-S22 admin hiring dashboard renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/admin/placements/hiring`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByRole("heading", { name: "Hiring Dashboard" }).or(page.getByText("Hiring Dashboard").first())
    ).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui07/admin-hiring-dashboard.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui07-admin-hiring-dashboard.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI07-S23: Admin — Placements: Interviews list
  test("UI07-S23 admin placements interviews list renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/admin/placements/interviews`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByRole("heading", { name: "Interviews" }).or(page.getByText("Interviews").first())
    ).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui07/admin-interviews.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui07-admin-interviews.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI07-S24: Admin — Placements: Job settings
  test("UI07-S24 admin job settings renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/admin/placements/job-settings`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByRole("heading", { name: "Job Settings" }).or(page.getByText("Job Settings").first())
    ).toBeVisible();
    await expect(page.getByText("Save").first()).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui07/admin-job-settings.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui07-admin-job-settings.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI07-S25: Admin — Placements: Drive detail — dynamic route; skip
  test.skip("UI07-S25 admin drive detail (dynamic route — requires seeded jobId)", async () => {
    // Replace JOB_ID with an actual ID from the dev DB seed.
    // await page.goto(`${DEV_HOST}/admin/placements/jobs/JOB_ID`);
  });

  // UI07-S26: Admin — Drive applicants tab — dynamic route; skip
  test.skip("UI07-S26 admin drive applicants tab (dynamic route — requires seeded jobId)", async () => {
    // await page.goto(`${DEV_HOST}/admin/placements/jobs/JOB_ID/applications`);
  });

  // UI07-S27: Admin — Drive rounds tab — dynamic route; skip
  test.skip("UI07-S27 admin drive rounds tab (dynamic route — requires seeded jobId)", async () => {
    // await page.goto(`${DEV_HOST}/admin/placements/jobs/JOB_ID`);
    // Then navigate to the Rounds tab.
  });

  // UI07-S28: Admin — Drive offers tab — dynamic route; skip
  test.skip("UI07-S28 admin drive offers tab (dynamic route — requires seeded jobId)", async () => {
    // await page.goto(`${DEV_HOST}/admin/placements/jobs/JOB_ID/shortlisted`);
  });

  // UI07-S29: Admin — Drive discussion tab — dynamic route; skip
  test.skip("UI07-S29 admin drive discussion tab (dynamic route — requires seeded jobId)", async () => {
    // await page.goto(`${DEV_HOST}/admin/placements/jobs/JOB_ID`);
    // Then navigate to the Discussion tab.
  });

  // UI07-S30: Admin — Drive about tab — dynamic route; skip
  test.skip("UI07-S30 admin drive about tab (dynamic route — requires seeded jobId)", async () => {
    // await page.goto(`${DEV_HOST}/admin/placements/jobs/JOB_ID/settings`);
  });

  // UI07-S31: Admin — Placements: Joining / onboarding
  test("UI07-S31 admin placements joining renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/admin/placements/joining`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByRole("heading", { name: "Joining" }).or(page.getByText("Joining").first())
    ).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui07/admin-joining.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui07-admin-joining.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI07-S32: Admin — Placements: New drive
  test("UI07-S32 admin new drive form renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/admin/placements/new`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByRole("heading", { name: "New Drive" }).or(page.getByText("New Drive").first())
    ).toBeVisible();
    await expect(page.getByText("Create Drive").first()).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui07/admin-new-drive.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui07-admin-new-drive.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI07-S33: Admin — Placements: Offers list
  test("UI07-S33 admin placements offers list renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/admin/placements/offers`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByRole("heading", { name: "Offers" }).or(page.getByText("Offers").first())
    ).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui07/admin-offers.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui07-admin-offers.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI07-S34: Admin — Placements: Organisation applications
  test("UI07-S34 admin org applications renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/admin/placements/organization-applications`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByRole("heading", { name: "Organisation Applications" }).or(page.getByText("Organisation Applications").first())
    ).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui07/admin-org-applications.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui07-admin-org-applications.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI07-S35: Admin — Placements: Organisation jobs
  test("UI07-S35 admin org jobs renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/admin/placements/organization-jobs`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByRole("heading", { name: "Organisation Jobs" }).or(page.getByText("Organisation Jobs").first())
    ).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui07/admin-org-jobs.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui07-admin-org-jobs.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI07-S36: Admin — Placements: Retention
  test("UI07-S36 admin placements retention renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/admin/placements/retention`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByRole("heading", { name: "Retention" }).or(page.getByText("Retention").first())
    ).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui07/admin-retention.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui07-admin-retention.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI07-S37: Admin — Placements: Screenings
  test("UI07-S37 admin placements screenings renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/admin/placements/screenings`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByRole("heading", { name: "Screenings" }).or(page.getByText("Screenings").first())
    ).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui07/admin-screenings.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui07-admin-screenings.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI07-S38: Admin — Placements: Seasons
  test("UI07-S38 admin placements seasons renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/admin/placements/seasons`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByRole("heading", { name: "Seasons" }).or(page.getByText("Seasons").first())
    ).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui07/admin-seasons.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui07-admin-seasons.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI07-S39: Admin — Placements: Shortlisted
  test("UI07-S39 admin placements shortlisted renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/admin/placements/shortlisted`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByRole("heading", { name: "Shortlisted" }).or(page.getByText("Shortlisted").first())
    ).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui07/admin-shortlisted.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui07-admin-shortlisted.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI07-S40: Admin — Placements: Student lookup
  test("UI07-S40 admin placements student lookup renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/admin/placements/student-lookup`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByRole("heading", { name: "Student Lookup" }).or(page.getByText("Student Lookup").first())
    ).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui07/admin-student-lookup.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui07-admin-student-lookup.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI07-S41: Admin — Placements: Recruiter accounts
  test("UI07-S41 admin recruiter accounts renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/admin/recruiters`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByRole("heading", { name: "Recruiter Accounts" }).or(page.getByText("Recruiter Accounts").first())
    ).toBeVisible();
    await expect(page.getByText("Invite Recruiter").first()).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui07/admin-recruiter-accounts.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui07-admin-recruiter-accounts.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });
});

// ---------------------------------------------------------------------------
// UI-07 — COLLEGE ADMIN PLACEMENTS SURFACES
// (college-admin role; tested with admin.json)
// ---------------------------------------------------------------------------

test.describe("UI-07 Visual Parity — College Admin Placements surfaces", () => {
  test.use({ storageState: "tests/.auth/admin.json" });

  // UI07-S42: College — Placements: Home
  test("UI07-S42 college placements home renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/college/placements`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByRole("heading", { name: "Placements" }).or(page.getByText("Placements").first())
    ).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui07/college-placements-home.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui07-college-placements-home.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI07-S43: College — Placements: Calendar
  test("UI07-S43 college placements calendar renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/college/placements/calendar`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByRole("heading", { name: "Calendar" }).or(page.getByText("Calendar").first())
    ).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui07/college-calendar.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui07-college-calendar.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI07-S44: College — Placements: Drives
  test("UI07-S44 college placements drives renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/college/placements/drives`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByRole("heading", { name: "Drives" }).or(page.getByText("Drives").first())
    ).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui07/college-drives.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui07-college-drives.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI07-S45: College — Placements: Interviews
  test("UI07-S45 college placements interviews renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/college/placements/interviews`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByRole("heading", { name: "Interviews" }).or(page.getByText("Interviews").first())
    ).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui07/college-interviews.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui07-college-interviews.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI07-S46: College — Drive detail — dynamic route; skip
  test.skip("UI07-S46 college drive detail (dynamic route — requires seeded jobId)", async () => {
    // Replace JOB_ID with an actual ID from the dev DB seed.
    // await page.goto(`${DEV_HOST}/college/placements/jobs/JOB_ID`);
  });

  // UI07-S47: College — Placements: New drive
  test("UI07-S47 college new drive form renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/college/placements/new`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByRole("heading", { name: "New Drive" }).or(page.getByText("New Drive").first())
    ).toBeVisible();
    await expect(page.getByText("Create Drive").first()).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui07/college-new-drive.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui07-college-new-drive.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI07-S48: College — Placements: Readiness by department
  test("UI07-S48 college placements readiness by department renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/college/placements/readiness-by-department`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByRole("heading", { name: "Readiness by Department" }).or(page.getByText("Readiness by Department").first())
    ).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui07/college-readiness-by-department.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui07-college-readiness-by-department.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI07-S49: College — Placements: Retention
  test("UI07-S49 college placements retention renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/college/placements/retention`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByRole("heading", { name: "Retention" }).or(page.getByText("Retention").first())
    ).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui07/college-retention.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui07-college-retention.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI07-S50: College — Placements: Student lookup
  test("UI07-S50 college placements student lookup renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/college/placements/student-lookup`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByRole("heading", { name: "Student Lookup" }).or(page.getByText("Student Lookup").first())
    ).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui07/college-student-lookup.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui07-college-student-lookup.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI07-S51: College — Hiring dashboard
  test("UI07-S51 college hiring dashboard renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/college/hiring-dashboard`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByRole("heading", { name: "Hiring Dashboard" }).or(page.getByText("Hiring Dashboard").first())
    ).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui07/college-hiring-dashboard.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui07-college-hiring-dashboard.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });
});

// ---------------------------------------------------------------------------
// UI-07 — TPO SURFACES
// Skipped: TPO test account not yet provisioned in dev seed.
// Remove skip and set storageState: "tests/.auth/tpo.json" once account is seeded.
// ---------------------------------------------------------------------------

test.describe("UI-07 Visual Parity — TPO surfaces", () => {
  test.skip("UI07-TPO tpo placements surfaces (TPO test account not provisioned)", async () => {
    // storageState: "tests/.auth/tpo.json"
    // TPO-specific placement surfaces to be added once tpo.json is seeded.
  });
});
