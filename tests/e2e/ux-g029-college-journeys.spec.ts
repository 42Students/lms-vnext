import { expect, test, type Page } from "@playwright/test";
import { authenticateGracefulRole } from "./support/roles";

const enabled = process.env.E2E_AUTH_ENABLED === "true" && Boolean(process.env.E2E_AUTH_SECRET);
const routes = [
  { path: "/college/announcements", heading: "Announcements" },
  { path: "/college/assignments", heading: "Assignments" },
  { path: "/college/attendance", heading: "Attendance" },
  { path: "/college/attendance/corrections", heading: "Attendance correction windows" },
  { path: "/college/attendance/departments", heading: "Attendance by Department" },
  { path: "/college/attendance/settings", heading: "Attendance policy" },
] as const;

async function assertNoOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, "No horizontal overflow in authenticated college route").toBeLessThanOrEqual(2);
}

test.describe("UX-G029 College Admin complete route-level navigation and recovery", () => {
  test.skip(!enabled, "Requires disposable seeded PostgreSQL and ephemeral role credentials");

  for (const viewport of [
    {name:"desktop",width:1280,height:800},
    {name:"mobile",width:390,height:844},
  ] as const) {
    test(`college admin can open all six scoped UX-G029 routes on ${viewport.name}`, async ({ page, context }, info) => {
      test.setTimeout(180_000);
      await authenticateGracefulRole(context, "college");
      await page.setViewportSize(viewport);

      for (const route of routes) {
        const response = await page.goto(route.path);
        expect(response?.status(), route.path).toBeLessThan(400);
        await expect(page.getByRole("heading", {level:1,name:route.heading,exact:true})).toBeVisible();
        await expect(page.getByRole("heading", {name:/Access denied|not authorized|Unavailable/i})).toHaveCount(0);
        await assertNoOverflow(page);
        await page.screenshot({
          path:info.outputPath(route.path.slice(1).replaceAll("/", "-")+"-"+viewport.name+".png"),
          fullPage:true,
        });
      }

      await page.goto("/college/attendance/settings");
      // College-admin policy is intentionally read-only; a link must not
      // accidentally elevate privileges or expose privileged mutation CTAs.
      await expect(page.getByRole("button",{name:/Save setting|Reset to default/i})).toHaveCount(0);

      await page.goto("/college/assignments?status=not-a-valid-assessment-status");
      await expect(page.getByText("Invalid assessment filters")).toBeVisible();
      await expect(page.getByRole("link",{name:"Clear filters"})).toHaveAttribute("href","/college/assignments");
      await assertNoOverflow(page);
    });

    test(`learner cannot access college admin announcements and policy editing on ${viewport.name}`, async ({ page, context }) => {
      await authenticateGracefulRole(context, "learner");
      await page.setViewportSize(viewport);
      for (const path of ["/college/announcements", "/college/attendance/settings"]) {
        const response = await page.goto(path, { waitUntil:"commit" });
        const denied = response?.status() === 401 || response?.status() === 403 ||
          response?.status() === 404 ||
          !new URL(page.url()).pathname.startsWith("/college/") ||
          await page.getByText(/access denied|not authorized|permission denied|no access/i).count() > 0;
        expect(denied, `Learner must not read privileged ${path} content`).toBe(true);
        await expect(page.getByRole("button",{name:/Save setting|Publish announcement/i})).toHaveCount(0);
      }
    });
  }
});
