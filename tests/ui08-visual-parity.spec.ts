/**
 * UI-08 P04: Visual parity test — TPO / Recruiter CRM
 *
 * Playwright tests asserting page render, key string visibility, and screenshot
 * baseline for the 42 surfaces in the UI-08 domain.
 *
 * Standard: < 0.5% pixel variance at 1440×900 (desktop) and 375×812 (mobile).
 *
 * Test accounts (from scripts/seed-test-tenants.ts):
 *   tpo@testa.42lms.com / Test@1234      → tests/.auth/tpo.json
 *   hr@testa.42lms.com  / Test@1234      → tests/.auth/hr.json
 *
 * Surfaces using test.skip:
 *   - Dynamic-route surfaces ([jobId], [threadId]) — require a seeded ID from the running dev DB
 *   - Recruiter role — separate recruiter test account not yet provisioned in dev seed
 *   - Transient loading/error states — require API mocking, out of scope for P04 baseline
 *   - Overflow nav (S22) — renders same shell as S01; no separate route
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
// UI-08 — TPO SURFACES
// ---------------------------------------------------------------------------

test.describe("UI-08 Visual Parity — TPO surfaces", () => {
  test.use({ storageState: "tests/.auth/tpo.json" });

  // UI08-S01: TPO — Home (placement dashboard)
  test("UI08-S01 TPO home dashboard renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/college/placements`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByRole("heading", { name: "Home" }).or(page.getByText("Home").first())
    ).toBeVisible();
    // Key section labels from string catalogue
    await expect(
      page.getByText("What needs you").or(page.getByText("THIS SEASON SO FAR").first())
    ).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui08/tpo-home.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui08-tpo-home.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI08-S02: TPO — Navigation side nav
  test("UI08-S02 TPO side nav items visible", async ({ page }) => {
    await page.goto(`${DEV_HOST}/college/placements`);
    await waitForContent(page);
    await assertPageOk(page);
    // Core nav items from string catalogue
    await expect(page.getByText("Drives").first()).toBeVisible();
    await expect(page.getByText("Students").first()).toBeVisible();
    await expect(page.getByText("Companies").first()).toBeVisible();
  });

  // UI08-S03: TPO — Drives list
  test("UI08-S03 TPO drives list renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/college/placements/drives`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByRole("heading", { name: "Drives" }).or(page.getByText("Drives").first())
    ).toBeVisible();
    // Tab labels from string catalogue
    await expect(page.getByText("Requests").first()).toBeVisible();
    await expect(page.getByText("Drafts").first()).toBeVisible();
    await expect(page.getByText("Live").first()).toBeVisible();
    await expect(page.getByText("Closed").first()).toBeVisible();
    await expect(page.getByText("New Drive").first()).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui08/tpo-drives-list.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui08-tpo-drives-list.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI08-S04: TPO — Drive detail — dynamic route; skip
  test.skip("UI08-S04 TPO drive detail (dynamic route — requires seeded jobId)", async () => {
    // Replace JOB_ID with an actual ID from the dev DB seed.
    // storageState: "tests/.auth/tpo.json"
    // await page.goto(`${DEV_HOST}/college/placements/jobs/JOB_ID`);
  });

  // UI08-S05: TPO — Students list (student tracking hub)
  test("UI08-S05 TPO students list renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/college/placements/student-lookup`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByRole("heading", { name: "Students" }).or(page.getByText("Students").first())
    ).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui08/tpo-students-list.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui08-tpo-students-list.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI08-S06: TPO — Companies list (company CRM)
  test("UI08-S06 TPO companies list renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/college/placements/companies`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByRole("heading", { name: "Companies" }).or(page.getByText("Companies").first())
    ).toBeVisible();
    await expect(page.getByText("Add Company").first()).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui08/tpo-companies-list.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui08-tpo-companies-list.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI08-S07: TPO — Calendar
  test("UI08-S07 TPO calendar renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/college/placements/calendar`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByRole("heading", { name: "Calendar" }).or(page.getByText("Calendar").first())
    ).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui08/tpo-calendar.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui08-tpo-calendar.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI08-S08: TPO — Reports (placement analytics)
  test("UI08-S08 TPO reports page renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/college/placements/retention`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByRole("heading", { name: "Reports" }).or(page.getByText("Reports").first())
    ).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui08/tpo-reports.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui08-tpo-reports.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI08-S09: TPO — Announcements list
  test("UI08-S09 TPO announcements list renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/college/placements/announcements`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByRole("heading", { name: "Announcements" }).or(page.getByText("Announcements").first())
    ).toBeVisible();
    await expect(page.getByText("New Announcement").first()).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui08/tpo-announcements.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui08-tpo-announcements.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI08-S10: TPO — Settings (eligibility criteria builder)
  test("UI08-S10 TPO settings page renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/college/placements/job-settings`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByRole("heading", { name: "Settings" }).or(page.getByText("Settings").first())
    ).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui08/tpo-settings.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui08-tpo-settings.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI08-S11: TPO — Batches / Readiness by department
  test("UI08-S11 TPO readiness by department renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/college/placements/readiness-by-department`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(page.locator("body")).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui08/tpo-readiness-by-department.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui08-tpo-readiness-by-department.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI08-S12: TPO — Recruiters
  test("UI08-S12 TPO recruiters list renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/admin/placements/recruiters`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByRole("heading", { name: "Recruiters" }).or(page.getByText("Recruiters").first())
    ).toBeVisible();
    await expect(page.getByText("Invite Recruiter").first()).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui08/tpo-recruiters.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui08-tpo-recruiters.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI08-S13: TPO — Team
  test("UI08-S13 TPO team page renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/college/placements/team`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByRole("heading", { name: "Team" }).or(page.getByText("Team").first())
    ).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui08/tpo-team.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui08-tpo-team.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI08-S14: TPO — Messages / Conversations (communication log)
  test("UI08-S14 TPO messages/conversations renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/hr/conversations`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByRole("heading", { name: "Messages" })
        .or(page.getByRole("heading", { name: "Conversations" }))
        .or(page.getByText("Messages").first())
    ).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui08/tpo-messages.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui08-tpo-messages.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI08-S15: TPO — Notifications
  test("UI08-S15 TPO notifications page renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/hr/notifications`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByRole("heading", { name: "Notifications" }).or(page.getByText("Notifications").first())
    ).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui08/tpo-notifications.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui08-tpo-notifications.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI08-S16: TPO — Profile
  test("UI08-S16 TPO profile page renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/hr/profile`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByRole("heading", { name: "Profile" }).or(page.getByText("Profile").first())
    ).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui08/tpo-profile.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui08-tpo-profile.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI08-S17: TPO — Audit
  test("UI08-S17 TPO audit page renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/college/placements/audit`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByRole("heading", { name: "Audit" }).or(page.getByText("Audit").first())
    ).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui08/tpo-audit.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui08-tpo-audit.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI08-S18: TPO — Verification (screenings)
  test("UI08-S18 TPO verification/screenings page renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/college/placements/screenings`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(page.locator("body")).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui08/tpo-screenings.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui08-tpo-screenings.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI08-S19: TPO — Requests / Applications
  test("UI08-S19 TPO requests/applications page renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/college/placements/applications`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(page.locator("body")).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui08/tpo-applications.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui08-tpo-applications.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI08-S20: TPO — Season dashboard
  test("UI08-S20 TPO season dashboard renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/admin/placements/seasons`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(page.locator("body")).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui08/tpo-seasons.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui08-tpo-seasons.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI08-S21: TPO — Hiring dashboard
  test("UI08-S21 TPO hiring dashboard renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/college/hiring-dashboard`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByRole("heading", { name: "Hiring Dashboard" })
        .or(page.getByText("Hiring Dashboard").first())
    ).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui08/tpo-hiring-dashboard.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui08-tpo-hiring-dashboard.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI08-S22: TPO — More / overflow nav — no dedicated route; renders same shell as S01
  // Covered by S01 home test; no separate test needed.
});

// ---------------------------------------------------------------------------
// UI-08 — TPO SURFACES — MOBILE VIEWPORT
// ---------------------------------------------------------------------------

test.describe("UI-08 Visual Parity — TPO surfaces (mobile 375px)", () => {
  test.use({
    storageState: "tests/.auth/tpo.json",
    viewport: { width: 375, height: 812 },
  });

  test("UI08-S01-mobile TPO home mobile layout renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/college/placements`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(page).toHaveScreenshot("ui08-tpo-home-mobile.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  test("UI08-S03-mobile TPO drives list mobile layout renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/college/placements/drives`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(page).toHaveScreenshot("ui08-tpo-drives-list-mobile.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });
});

// ---------------------------------------------------------------------------
// UI-08 — HR SURFACES
// ---------------------------------------------------------------------------

test.describe("UI-08 Visual Parity — HR/Recruiter surfaces", () => {
  test.use({ storageState: "tests/.auth/hr.json" });

  // UI08-S23: HR — Home (HR access portal)
  test("UI08-S23 HR home renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/hr/home`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByRole("heading", { name: "Today" })
        .or(page.getByText("Today").first())
        .or(page.getByText("Loading recruiter home").first())
    ).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui08/hr-home.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui08-hr-home.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI08-S24: HR — Drives list
  test("UI08-S24 HR drives list renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/hr/drives`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByRole("heading", { name: "Drives" }).or(page.getByText("Drives").first())
    ).toBeVisible();
    await expect(page.getByText("New Drive").first()).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui08/hr-drives-list.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui08-hr-drives-list.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI08-S25: HR — New drive (drive creation wizard)
  test("UI08-S25 HR new drive form renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/hr/drives/new`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByRole("heading", { name: "New Drive" }).or(page.getByText("New Drive").first())
    ).toBeVisible();
    await expect(page.getByText("Create Drive").first()).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui08/hr-drives-new.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui08-hr-drives-new.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI08-S26: HR — Drive proposals
  test("UI08-S26 HR drive proposals renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/hr/drives/proposals`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByRole("heading", { name: "Proposals" }).or(page.getByText("Proposals").first())
    ).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui08/hr-drives-proposals.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui08-hr-drives-proposals.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI08-S27: HR — Drive recorded from outside
  test("UI08-S27 HR record drive from outside renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/hr/drives/recorded-outside`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByRole("heading", { name: "Record Drive" }).or(page.getByText("Record Drive").first())
    ).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui08/hr-drives-recorded-outside.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui08-hr-drives-recorded-outside.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI08-S28: HR — Drive detail: Interview slots — dynamic route; skip
  test.skip("UI08-S28 HR drive interview slots (dynamic route — requires seeded jobId)", async () => {
    // Replace JOB_ID with an actual ID from the dev DB seed.
    // await page.goto(`${DEV_HOST}/hr/drives/JOB_ID/interview-slots`);
  });

  // UI08-S29: HR — Drive detail: Messages thread — dynamic route; skip
  test.skip("UI08-S29 HR drive messages thread (dynamic route — requires seeded jobId)", async () => {
    // Replace JOB_ID with an actual ID from the dev DB seed.
    // await page.goto(`${DEV_HOST}/hr/drives/JOB_ID/messages`);
  });

  // UI08-S30: HR — Drive detail: Rounds editor — dynamic route; skip
  test.skip("UI08-S30 HR drive rounds editor (dynamic route — requires seeded jobId)", async () => {
    // Replace JOB_ID with an actual ID from the dev DB seed.
    // await page.goto(`${DEV_HOST}/hr/drives/JOB_ID/rounds/editor`);
  });

  // UI08-S31: HR — Calendar
  test("UI08-S31 HR calendar renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/hr/calendar`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByRole("heading", { name: "Calendar" }).or(page.getByText("Calendar").first())
    ).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui08/hr-calendar.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui08-hr-calendar.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI08-S32: HR — Colleges
  test("UI08-S32 HR colleges list renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/hr/colleges`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByRole("heading", { name: "Colleges" }).or(page.getByText("Colleges").first())
    ).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui08/hr-colleges.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui08-hr-colleges.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI08-S33: HR — Company (company CRM)
  test("UI08-S33 HR company page renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/hr/company`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByRole("heading", { name: "Company" }).or(page.getByText("Company").first())
    ).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui08/hr-company.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui08-hr-company.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI08-S34: HR — Company reports (placement analytics)
  test("UI08-S34 HR company reports renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/hr/company/reports`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByRole("heading", { name: "Reports" }).or(page.getByText("Reports").first())
    ).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui08/hr-company-reports.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui08-hr-company-reports.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI08-S35: HR — Conversations list (communication log)
  test("UI08-S35 HR conversations list renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/hr/conversations`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByRole("heading", { name: "Conversations" }).or(page.getByText("Conversations").first())
    ).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui08/hr-conversations.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui08-hr-conversations.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI08-S36: HR — Conversation thread — dynamic route; skip
  test.skip("UI08-S36 HR conversation thread (dynamic route — requires seeded threadId)", async () => {
    // Replace THREAD_ID with an actual ID from the dev DB seed.
    // await page.goto(`${DEV_HOST}/hr/conversations/THREAD_ID`);
  });

  // UI08-S37: HR — Notifications
  test("UI08-S37 HR notifications page renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/hr/notifications`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByRole("heading", { name: "Notifications" }).or(page.getByText("Notifications").first())
    ).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui08/hr-notifications.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui08-hr-notifications.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI08-S38: HR — Placements
  test("UI08-S38 HR placements page renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/hr/placements`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByRole("heading", { name: "Placements" }).or(page.getByText("Placements").first())
    ).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui08/hr-placements.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui08-hr-placements.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI08-S39: HR — Profile
  test("UI08-S39 HR profile page renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/hr/profile`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByRole("heading", { name: "Profile" }).or(page.getByText("Profile").first())
    ).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui08/hr-profile.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui08-hr-profile.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI08-S40: HR — Round results
  test("UI08-S40 HR round results page renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/hr/round-results`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByRole("heading", { name: "Round Results" }).or(page.getByText("Round Results").first())
    ).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui08/hr-round-results.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui08-hr-round-results.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI08-S41: HR — Messages
  test("UI08-S41 HR messages page renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/hr/messages`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByRole("heading", { name: "Messages" }).or(page.getByText("Messages").first())
    ).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui08/hr-messages.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui08-hr-messages.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });
});

// ---------------------------------------------------------------------------
// UI-08 — HR SURFACES — MOBILE VIEWPORT
// ---------------------------------------------------------------------------

test.describe("UI-08 Visual Parity — HR surfaces (mobile 375px)", () => {
  test.use({
    storageState: "tests/.auth/hr.json",
    viewport: { width: 375, height: 812 },
  });

  test("UI08-S23-mobile HR home mobile layout renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/hr/home`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(page).toHaveScreenshot("ui08-hr-home-mobile.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  test("UI08-S33-mobile HR company page mobile layout renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/hr/company`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(page).toHaveScreenshot("ui08-hr-company-mobile.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });
});

// ---------------------------------------------------------------------------
// UI-08 — RECRUITER SURFACES
// Skipped: dedicated Recruiter test account not yet provisioned in dev seed.
// Remove skip and set storageState: "tests/.auth/recruiter.json" once seeded.
// ---------------------------------------------------------------------------

test.describe("UI-08 Visual Parity — Recruiter surfaces", () => {
  // UI08-S42: Recruiter — Navigation
  test.skip("UI08-S42 recruiter navigation (recruiter test account not provisioned)", async () => {
    // storageState: "tests/.auth/recruiter.json"
    // await page.goto(`${DEV_HOST}/recruiter`);
    // Tabs: Today, Drives, Calendar, Messages, Company & Team
  });
});
