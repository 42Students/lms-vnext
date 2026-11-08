import { expect, test } from "@playwright/test";
import { authenticateGracefulRole } from "./support/roles";

/** UX-G074, UX-G090, UX-G120: real seeded role pages, no write requests. */
const sizes = [
  { name: "desktop", width: 1280, height: 800 },
  { name: "mobile", width: 390, height: 844 },
] as const;

async function noOverflow(page: import("@playwright/test").Page) {
  expect(await page.evaluate(() =>
    document.documentElement.scrollWidth <= window.innerWidth
  ), "no horizontal page overflow").toBe(true);
}

test.describe("Scoped seeded role UX acceptance", () => {
  test.skip(process.env.UX_SCOPED_ROLE_SEED !== "true",
    "Requires dedicated isolated E2E database and seeded Mentor/TPO memberships");

for (const size of sizes) {
  test(`UX-G074 ${size.name}: Mentor task queue and coverage show helpful filters and results`,
    async ({page, context}, testInfo) => {
      await authenticateGracefulRole(context, "mentor");
      await page.setViewportSize(size);
      await page.goto("/mentor/task-reviews?search=UX_NO_MATCH_TEST");
      await expect(page.getByRole("heading", { name: "Task reviews" })).toBeVisible();
      const taskFilter = page.getByRole("search", { name: "mentor task reviews filters" });
      await expect(taskFilter).toBeVisible();
      await expect(taskFilter.getByRole("button", { name: "Apply filters" })).toBeVisible();
      await expect(taskFilter.getByRole("link", { name: "Clear filters" })).toHaveAttribute("href", "/mentor/task-reviews");
      await expect(page.getByText("No task reviews match your filters").first()).toBeVisible();
      await noOverflow(page);

      await page.goto("/mentor/team-coverage?filter=NO_LEARNERS&search=UX_NO_MATCH_TEST");
      await expect(page.getByRole("heading", { name: "Team coverage" })).toBeVisible();
      const coverageFilter = page.getByRole("search", { name: "mentor team coverage filters" });
      await expect(coverageFilter.getByRole("button", { name: "Apply filters" })).toBeVisible();
      await expect(coverageFilter.getByRole("link", { name: "Clear filters" })).toHaveAttribute("href", "/mentor/team-coverage");
      await expect(page.getByRole("status").filter({hasText:/No projects match the current filters|No current assigned projects/}).first()).toBeVisible();
      await noOverflow(page);
      await page.goto("/mentor/team-coverage?status=INVALID");
      await expect(page.getByRole("alert").filter({hasText:"Invalid team coverage filters"})).toBeVisible();
      await expect(page.getByRole("link", { name: "Clear filters" })).toHaveAttribute("href", "/mentor/team-coverage");
      await page.screenshot({path:testInfo.outputPath("ux-g074-"+size.name+".png"),fullPage:true});
    });

  test(`UX-G090 ${size.name}: Faculty course list and visible detail shortcuts`,
    async ({page,context}, testInfo) => {
      await authenticateGracefulRole(context, "faculty");
      await page.setViewportSize(size);
      await page.goto("/teach/courses");
      await expect(page.getByRole("heading", { name: "My Teaching Courses" })).toBeVisible();
      await expect(page.getByText("Find the courses and class sections you teach.")).toBeVisible();
      const link = page.locator('a[href^="/teacher/courses/"]').first();
      await expect(link).toBeVisible();
      const destination = await link.getAttribute("href");
      const deliveryId = destination?.match(/\/teacher\/courses\/([0-9a-f-]{36})(?:\/|$)/i)?.[1];
      expect(deliveryId, "seeded course must expose an actual delivery link").toBeTruthy();
      await page.goto("/teach/courses/" + deliveryId);
      const navigation = page.getByRole("navigation", { name: "Course navigation" });
      await expect(navigation.getByRole("link", { name: /My Teaching Courses/ })).toBeVisible();
      await expect(navigation.getByRole("link", { name: "Students" })).toHaveAttribute("href", "/teacher/courses/" + deliveryId + "/students");
      await expect(navigation.getByRole("link", { name: "Attendance" })).toBeVisible();
      await expect(navigation.getByRole("link", { name: "Discussions" })).toBeVisible();
      // These shortcuts must not be trapped behind a closed disclosure.
      await noOverflow(page);
      await page.screenshot({path:testInfo.outputPath("ux-g090-"+size.name+".png"),fullPage:true});
    });

  test(`UX-G120 ${size.name}: TPO team and verification recoverable filters`,
    async ({page,context}, testInfo) => {
      await authenticateGracefulRole(context, "tpo");
      await page.setViewportSize(size);
      await page.goto("/tpo/team/everyone?page=invalid");
      await expect(page.getByRole("alert").filter({hasText:"No messages were loaded"})).toBeVisible();
      await expect(page.getByRole("link", { name: "View newest messages" })).toHaveAttribute("href", "/tpo/team/everyone");
      await page.goto("/tpo/team/everyone?page=1");
      await expect(page.getByRole("heading", { name: "Everyone" }).first()).toBeVisible();
      // The server may report a migration unavailable state; never mistake it
      // for an empty conversation, and never claim messages were sent.
      await noOverflow(page);

      await page.goto("/tpo/verification?tab=VERIFIED&kind=IDENTITY");
      await expect(page.getByRole("heading", { name: "Verification" })).toBeVisible();
      await expect(page.getByText("1 active filter applied to this verification view.")).toBeVisible();
      const clear = page.getByRole("link", { name: "Clear filters (keep status)" });
      await expect(clear).toBeVisible();
      const href = await clear.getAttribute("href");
      expect(href).toContain("tab=VERIFIED");
      expect(href).toContain("kind=ALL");
      await noOverflow(page);
      await page.screenshot({path:testInfo.outputPath("ux-g120-"+size.name+".png"),fullPage:true});
    });
}

test("UX-G074 negative: learner cannot view mentor queue", async ({page,context}) => {
  await authenticateGracefulRole(context, "learner");
  await page.goto("/mentor/task-reviews");
  await expect(page).not.toHaveURL(/\/mentor\/task-reviews(?:\?|$)/);
  await expect(page.getByRole("heading", {name:"Task reviews"})).toHaveCount(0);
});
});
