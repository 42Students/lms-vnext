/**
 * UI-06 P04: Visual parity test — Projects & Mentorship
 *
 * Playwright tests asserting page render, key string visibility, and screenshot
 * baseline for all 63 surfaces in the UI-06 domain.
 *
 * Standard: < 0.5% pixel variance at 1440×900 (desktop) and 375×812 (mobile).
 *
 * Test accounts (from scripts/seed-test-tenants.ts):
 *   learner@testa.42lms.com / Test@1234
 *   faculty@testa.42lms.com / Test@1234
 *   admin@testa.42lms.com   / Test@1234
 *   superadmin@testa.42lms.com / Test@1234
 *
 * Surfaces needing test.skip:
 *   - Dynamic-route surfaces ([templateId], [workspaceId], [projectId], [submissionId],
 *     [meetingId], [meetingKey], [taskId]) — require seeded IDs from the running dev DB
 *   - Mentor role surfaces — mentor test account not yet provisioned in dev seed
 *   - Transient loading/error states — require API mocking, out of scope for P04 baseline
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
// UI-06 — SUPERADMIN: TEMPLATE LIBRARY SURFACES
// ---------------------------------------------------------------------------

test.describe("UI-06 Visual Parity — SuperAdmin Template Library", () => {
  test.use({ storageState: "tests/.auth/admin.json" });

  // UI06-S01: Templates list
  test("UI06-S01 superadmin templates list renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/admin/projects/templates`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(page.getByText("Templates").first()).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui06/superadmin-templates-list.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui06-superadmin-templates-list.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI06-S02: Create template form
  test("UI06-S02 superadmin create template page renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/admin/projects/templates/new`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByText("New Template").or(page.getByText("Create Template").first())
    ).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui06/superadmin-templates-new.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui06-superadmin-templates-new.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI06-S03: Template detail — Overview tab (default redirect) — dynamic route; skip
  test.skip("UI06-S03 superadmin template detail root (dynamic route — requires seeded templateId)", async () => {
    // await page.goto(`${DEV_HOST}/admin/projects/templates/TEMPLATE_ID`);
  });

  // UI06-S04: Template detail — Overview tab (explicit) — dynamic route; skip
  test.skip("UI06-S04 superadmin template overview tab (dynamic route — requires seeded templateId)", async () => {
    // await page.goto(`${DEV_HOST}/admin/projects/templates/TEMPLATE_ID/overview`);
  });

  // UI06-S05: Template detail — Sprints tab — dynamic route; skip
  test.skip("UI06-S05 superadmin template sprints tab (dynamic route — requires seeded templateId)", async () => {
    // await page.goto(`${DEV_HOST}/admin/projects/templates/TEMPLATE_ID/sprints`);
  });

  // UI06-S06: Template detail — Tasks tab — dynamic route; skip
  test.skip("UI06-S06 superadmin template tasks tab (dynamic route — requires seeded templateId)", async () => {
    // await page.goto(`${DEV_HOST}/admin/projects/templates/TEMPLATE_ID/tasks`);
  });

  // UI06-S07: Template detail — Resources tab — dynamic route; skip
  test.skip("UI06-S07 superadmin template resources tab (dynamic route — requires seeded templateId)", async () => {
    // await page.goto(`${DEV_HOST}/admin/projects/templates/TEMPLATE_ID/resources`);
  });

  // UI06-S08: Template detail — Colleges tab — dynamic route; skip
  test.skip("UI06-S08 superadmin template colleges tab (dynamic route — requires seeded templateId)", async () => {
    // await page.goto(`${DEV_HOST}/admin/projects/templates/TEMPLATE_ID/colleges`);
  });

  // UI06-S09: Template detail — Versions tab — dynamic route; skip
  test.skip("UI06-S09 superadmin template versions tab (dynamic route — requires seeded templateId)", async () => {
    // await page.goto(`${DEV_HOST}/admin/projects/templates/TEMPLATE_ID/versions`);
  });
});

// ---------------------------------------------------------------------------
// UI-06 — SUPERADMIN: PROJECT WORKSPACE SURFACES
// ---------------------------------------------------------------------------

test.describe("UI-06 Visual Parity — SuperAdmin Project Workspaces", () => {
  test.use({ storageState: "tests/.auth/admin.json" });

  // UI06-S10: Workspaces list
  test("UI06-S10 superadmin workspaces list renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/admin/projects`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(page.getByText("Workspaces").first()).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui06/superadmin-workspaces-list.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui06-superadmin-workspaces-list.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI06-S11: Create workspace form
  test("UI06-S11 superadmin create workspace page renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/admin/projects/workspaces/new`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByText("New Workspace").or(page.getByText("Create Workspace").first())
    ).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui06/superadmin-workspaces-new.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui06-superadmin-workspaces-new.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI06-S12: Deleted workspaces
  test("UI06-S12 superadmin deleted workspaces page renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/admin/projects/workspaces/deleted`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(page.getByText("Deleted Workspaces").first()).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui06/superadmin-workspaces-deleted.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui06-superadmin-workspaces-deleted.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI06-S13: Reassign mentor
  test("UI06-S13 superadmin reassign mentor page renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/admin/projects/reassign-mentor`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(page.getByText("Reassign Mentor").first()).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui06/superadmin-reassign-mentor.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui06-superadmin-reassign-mentor.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI06-S14 through S24: Workspace detail tabs — dynamic route; skip
  test.skip("UI06-S14 superadmin workspace detail summary tab (dynamic route — requires seeded workspaceId)", async () => {
    // await page.goto(`${DEV_HOST}/admin/projects/workspaces/WORKSPACE_ID`);
  });

  test.skip("UI06-S15 superadmin workspace overview tab (dynamic route — requires seeded workspaceId)", async () => {
    // await page.goto(`${DEV_HOST}/admin/projects/WORKSPACE_ID`);
  });

  test.skip("UI06-S16 superadmin workspace team tab (dynamic route — requires seeded workspaceId)", async () => {
    // await page.goto(`${DEV_HOST}/admin/projects/WORKSPACE_ID/team`);
  });

  test.skip("UI06-S17 superadmin workspace sprints tab (dynamic route — requires seeded workspaceId)", async () => {
    // await page.goto(`${DEV_HOST}/admin/projects/WORKSPACE_ID/sprints`);
  });

  test.skip("UI06-S18 superadmin workspace tasks tab (dynamic route — requires seeded workspaceId)", async () => {
    // await page.goto(`${DEV_HOST}/admin/projects/WORKSPACE_ID/tasks`);
  });

  test.skip("UI06-S19 superadmin workspace resources tab (dynamic route — requires seeded workspaceId)", async () => {
    // await page.goto(`${DEV_HOST}/admin/projects/WORKSPACE_ID/resources`);
  });

  test.skip("UI06-S20 superadmin workspace meetings tab (dynamic route — requires seeded workspaceId)", async () => {
    // await page.goto(`${DEV_HOST}/admin/projects/WORKSPACE_ID/meetings`);
  });

  test.skip("UI06-S21 superadmin workspace readiness tab (dynamic route — requires seeded workspaceId)", async () => {
    // await page.goto(`${DEV_HOST}/admin/projects/WORKSPACE_ID/readiness`);
  });

  test.skip("UI06-S22 superadmin workspace delivery tab (dynamic route — requires seeded workspaceId)", async () => {
    // await page.goto(`${DEV_HOST}/admin/projects/WORKSPACE_ID/delivery`);
  });

  test.skip("UI06-S23 superadmin workspace audit tab (dynamic route — requires seeded workspaceId)", async () => {
    // await page.goto(`${DEV_HOST}/admin/projects/workspaces/WORKSPACE_ID/audit`);
  });

  test.skip("UI06-S24 superadmin workspace summary explicit tab (dynamic route — requires seeded workspaceId)", async () => {
    // await page.goto(`${DEV_HOST}/admin/projects/workspaces/WORKSPACE_ID/summary`);
  });

  // UI06-S25: At Risk list
  test("UI06-S25 superadmin at-risk workspaces page renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/superadmin/projects/at-risk`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(page.getByText("At Risk").first()).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui06/superadmin-at-risk.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui06-superadmin-at-risk.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI06-S26: Readiness list
  test("UI06-S26 superadmin readiness page renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/admin/projects/readiness`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(page.getByText("Readiness").first()).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui06/superadmin-readiness.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui06-superadmin-readiness.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI06-S27: Submissions list
  test("UI06-S27 superadmin submissions page renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/admin/projects/submissions`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(page.getByText("Submissions").first()).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui06/superadmin-submissions.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui06-superadmin-submissions.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI06-S28: Audit list
  test("UI06-S28 superadmin projects audit page renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/admin/projects/audit`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(page.getByText("Audit").first()).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui06/superadmin-projects-audit.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui06-superadmin-projects-audit.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });
});

// ---------------------------------------------------------------------------
// UI-06 — COLLEGE ADMIN: PROJECT WORKSPACE SURFACES
// ---------------------------------------------------------------------------

test.describe("UI-06 Visual Parity — CollegeAdmin Projects", () => {
  test.use({ storageState: "tests/.auth/admin.json" });

  // UI06-S29: College admin templates list
  test("UI06-S29 college admin templates list renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/college/projects/templates`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(page.getByText("Templates").first()).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui06/college-admin-templates-list.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui06-college-admin-templates-list.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI06-S30: College admin template detail — dynamic route; skip
  test.skip("UI06-S30 college admin template detail (dynamic route — requires seeded templateId)", async () => {
    // await page.goto(`${DEV_HOST}/college/projects/templates/TEMPLATE_ID`);
  });

  // UI06-S31: College admin workspaces list
  test("UI06-S31 college admin workspaces list renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/college/projects/workspaces`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(page.getByText("Workspaces").first()).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui06/college-admin-workspaces-list.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui06-college-admin-workspaces-list.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI06-S32: College admin workspace detail — dynamic route; skip
  test.skip("UI06-S32 college admin workspace detail (dynamic route — requires seeded workspaceId)", async () => {
    // await page.goto(`${DEV_HOST}/college/projects/workspaces/WORKSPACE_ID`);
  });

  // UI06-S33: College admin workspace delivery tab — dynamic route; skip
  test.skip("UI06-S33 college admin workspace delivery tab (dynamic route — requires seeded workspaceId)", async () => {
    // await page.goto(`${DEV_HOST}/college-admin/projects/workspaces/WORKSPACE_ID/delivery`);
  });

  // UI06-S34: College admin create workspace
  test("UI06-S34 college admin create workspace page renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/college/projects/create`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(
      page.getByText("New Workspace").or(page.getByText("Create Workspace").first())
    ).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui06/college-admin-workspaces-new.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui06-college-admin-workspaces-new.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI06-S35: College admin at-risk
  test("UI06-S35 college admin at-risk page renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/college/projects/at-risk`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(page.getByText("At Risk").first()).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui06/college-admin-at-risk.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui06-college-admin-at-risk.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI06-S36: College admin readiness
  test("UI06-S36 college admin readiness page renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/college/projects/readiness`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(page.getByText("Readiness").first()).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui06/college-admin-readiness.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui06-college-admin-readiness.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI06-S37: College admin submissions
  test("UI06-S37 college admin submissions page renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/college/projects/submissions`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(page.getByText("Submissions").first()).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui06/college-admin-submissions.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui06-college-admin-submissions.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI06-S38: College admin audit
  test("UI06-S38 college admin projects audit page renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/college/projects/audit`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(page.getByText("Audit").first()).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui06/college-admin-projects-audit.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui06-college-admin-projects-audit.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI06-S39: College admin reassign mentor
  test("UI06-S39 college admin reassign mentor page renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/college-admin/projects/workspaces/reassign-mentor`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(page.getByText("Reassign Mentor").first()).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui06/college-admin-reassign-mentor.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui06-college-admin-reassign-mentor.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI06-S40: College admin deleted workspaces
  test("UI06-S40 college admin deleted workspaces page renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/college/projects/deleted`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(page.getByText("Deleted Workspaces").first()).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui06/college-admin-workspaces-deleted.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui06-college-admin-workspaces-deleted.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });
});

// ---------------------------------------------------------------------------
// UI-06 — LEARNER: PROJECT SURFACES
// ---------------------------------------------------------------------------

test.describe("UI-06 Visual Parity — Learner Projects", () => {
  test.use({ storageState: "tests/.auth/learner.json" });

  // UI06-S41: Learner projects list
  test("UI06-S41 learner projects list renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/learn/projects`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(page.getByText("Projects").first()).toBeVisible();
    await page.screenshot({
      path: "tests/ui-snapshots/ui06/learner-projects-list.png",
      fullPage: true,
    });
    await expect(page).toHaveScreenshot("ui06-learner-projects-list.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });

  // UI06-S42: Learner project detail — dynamic route; skip
  test.skip("UI06-S42 learner project detail (dynamic route — requires seeded projectId)", async () => {
    // await page.goto(`${DEV_HOST}/learn/projects/PROJECT_ID`);
  });
});

// ---------------------------------------------------------------------------
// UI-06 — LEARNER: PROJECT SURFACES (MOBILE)
// ---------------------------------------------------------------------------

test.describe("UI-06 Visual Parity — Learner Projects (mobile 375px)", () => {
  test.use({
    storageState: "tests/.auth/learner.json",
    viewport: { width: 375, height: 812 },
  });

  test("UI06-S41-mobile learner projects list mobile layout renders", async ({ page }) => {
    await page.goto(`${DEV_HOST}/learn/projects`);
    await waitForContent(page);
    await assertPageOk(page);
    await expect(page).toHaveScreenshot("ui06-learner-projects-list-mobile.png", {
      maxDiffRatio: DIFF_THRESHOLD,
    });
  });
});

// ---------------------------------------------------------------------------
// UI-06 — MENTOR SURFACES
// Skipped: Mentor test account not yet provisioned in dev seed.
// Remove skip and set storageState: "tests/.auth/mentor.json" once account is seeded.
// ---------------------------------------------------------------------------

test.describe("UI-06 Visual Parity — Mentor Projects", () => {
  // UI06-S43: Mentor projects list
  test.skip("UI06-S43 mentor projects list (Mentor test account not provisioned)", async () => {
    // storageState: "tests/.auth/mentor.json"
    // await page.goto(`${DEV_HOST}/mentor/projects`);
  });

  // UI06-S44: Mentor project detail — dynamic route; skip
  test.skip("UI06-S44 mentor project detail (dynamic route + Mentor account not provisioned)", async () => {
    // storageState: "tests/.auth/mentor.json"
    // await page.goto(`${DEV_HOST}/mentor/projects/PROJECT_ID`);
  });

  // UI06-S45: Mentor project activity history — dynamic route; skip
  test.skip("UI06-S45 mentor project activity history (dynamic route + Mentor account not provisioned)", async () => {
    // storageState: "tests/.auth/mentor.json"
    // await page.goto(`${DEV_HOST}/mentor/projects/PROJECT_ID/activity-history`);
  });

  // UI06-S46: Mentor project board review — dynamic route; skip
  test.skip("UI06-S46 mentor project board review (dynamic route + Mentor account not provisioned)", async () => {
    // storageState: "tests/.auth/mentor.json"
    // await page.goto(`${DEV_HOST}/mentor/projects/PROJECT_ID/board-review`);
  });

  // UI06-S47: Mentor project closeout — dynamic route; skip
  test.skip("UI06-S47 mentor project closeout (dynamic route + Mentor account not provisioned)", async () => {
    // storageState: "tests/.auth/mentor.json"
    // await page.goto(`${DEV_HOST}/mentor/projects/PROJECT_ID/closeout`);
  });

  // UI06-S48: Mentor delivery submission review — dynamic route; skip
  test.skip("UI06-S48 mentor delivery submission review (dynamic route + Mentor account not provisioned)", async () => {
    // storageState: "tests/.auth/mentor.json"
    // await page.goto(`${DEV_HOST}/mentor/projects/PROJECT_ID/deliveries/SUBMISSION_ID/review`);
  });

  // UI06-S49: Mentor learner preview — dynamic route; skip
  test.skip("UI06-S49 mentor learner preview (dynamic route + Mentor account not provisioned)", async () => {
    // storageState: "tests/.auth/mentor.json"
    // await page.goto(`${DEV_HOST}/mentor/projects/PROJECT_ID/learner-preview`);
  });

  // UI06-S50: Mentor legacy meeting — dynamic route; skip
  test.skip("UI06-S50 mentor legacy meeting (dynamic route + Mentor account not provisioned)", async () => {
    // storageState: "tests/.auth/mentor.json"
    // await page.goto(`${DEV_HOST}/mentor/projects/PROJECT_ID/meetings/legacy/MEETING_KEY`);
  });

  // UI06-S51: Mentor meeting notes — dynamic route; skip
  test.skip("UI06-S51 mentor meeting notes (dynamic route + Mentor account not provisioned)", async () => {
    // storageState: "tests/.auth/mentor.json"
    // await page.goto(`${DEV_HOST}/mentor/projects/PROJECT_ID/meetings/MEETING_ID/notes`);
  });

  // UI06-S52: Mentor resources directory — dynamic route; skip
  test.skip("UI06-S52 mentor resources directory (dynamic route + Mentor account not provisioned)", async () => {
    // storageState: "tests/.auth/mentor.json"
    // await page.goto(`${DEV_HOST}/mentor/projects/PROJECT_ID/resources-directory`);
  });

  // UI06-S53: Mentor review completeness — dynamic route; skip
  test.skip("UI06-S53 mentor review completeness (dynamic route + Mentor account not provisioned)", async () => {
    // storageState: "tests/.auth/mentor.json"
    // await page.goto(`${DEV_HOST}/mentor/projects/PROJECT_ID/review-completeness`);
  });

  // UI06-S54: Mentor review overview — dynamic route; skip
  test.skip("UI06-S54 mentor review overview (dynamic route + Mentor account not provisioned)", async () => {
    // storageState: "tests/.auth/mentor.json"
    // await page.goto(`${DEV_HOST}/mentor/projects/PROJECT_ID/review-overview`);
  });

  // UI06-S55: Mentor risk readiness — dynamic route; skip
  test.skip("UI06-S55 mentor risk readiness (dynamic route + Mentor account not provisioned)", async () => {
    // storageState: "tests/.auth/mentor.json"
    // await page.goto(`${DEV_HOST}/mentor/projects/PROJECT_ID/risk-readiness`);
  });

  // UI06-S56: Mentor task feedback — dynamic route; skip
  test.skip("UI06-S56 mentor task feedback (dynamic route + Mentor account not provisioned)", async () => {
    // storageState: "tests/.auth/mentor.json"
    // await page.goto(`${DEV_HOST}/mentor/projects/PROJECT_ID/tasks/TASK_ID/feedback`);
  });

  // UI06-S57: Mentor team history — dynamic route; skip
  test.skip("UI06-S57 mentor team history (dynamic route + Mentor account not provisioned)", async () => {
    // storageState: "tests/.auth/mentor.json"
    // await page.goto(`${DEV_HOST}/mentor/projects/PROJECT_ID/team-history`);
  });

  // UI06-S58: Mentor team meetings — dynamic route; skip
  test.skip("UI06-S58 mentor team meetings (dynamic route + Mentor account not provisioned)", async () => {
    // storageState: "tests/.auth/mentor.json"
    // await page.goto(`${DEV_HOST}/mentor/projects/PROJECT_ID/team-meetings`);
  });

  // UI06-S59: Mentor timeline — dynamic route; skip
  test.skip("UI06-S59 mentor timeline (dynamic route + Mentor account not provisioned)", async () => {
    // storageState: "tests/.auth/mentor.json"
    // await page.goto(`${DEV_HOST}/mentor/projects/PROJECT_ID/timeline`);
  });

  // UI06-S60: Mentor reviews list
  test.skip("UI06-S60 mentor reviews list (Mentor test account not provisioned)", async () => {
    // storageState: "tests/.auth/mentor.json"
    // await page.goto(`${DEV_HOST}/mentor/reviews`);
  });

  // UI06-S61: Mentor sprint progress
  test.skip("UI06-S61 mentor sprint progress (Mentor test account not provisioned)", async () => {
    // storageState: "tests/.auth/mentor.json"
    // await page.goto(`${DEV_HOST}/mentor/sprint-progress`);
  });

  // UI06-S62: Mentor task reviews
  test.skip("UI06-S62 mentor task reviews (Mentor test account not provisioned)", async () => {
    // storageState: "tests/.auth/mentor.json"
    // await page.goto(`${DEV_HOST}/mentor/task-reviews`);
  });

  // UI06-S63: Mentor team coverage
  test.skip("UI06-S63 mentor team coverage (Mentor test account not provisioned)", async () => {
    // storageState: "tests/.auth/mentor.json"
    // await page.goto(`${DEV_HOST}/mentor/team-coverage`);
  });
});
