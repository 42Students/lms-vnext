import { expect, test } from "@playwright/test";
import { authenticateGracefulRole } from "./support/roles";

const enabled = process.env.E2E_AUTH_ENABLED === "true" &&
  Boolean(process.env.E2E_AUTH_SECRET);

test.describe("UX-G063 — learner placement legacy aliases", () => {
  test.skip(!enabled, "Requires disposable PostgreSQL and seeded authenticated Learner");

  test("non-Learner cannot open either placement bookmark or inspect query context",
    async ({ page, context }) => {
      await authenticateGracefulRole(context, "faculty");
      for (const route of [
        "/learn/my-placements/calendar?jobId=81818181-8181-4818-8818-818181818181",
        "/learn/my-placements/interviews?roundId=83838383-8383-4838-8838-838383838383",
      ]) {
        await page.goto(route);
        // The outer Learner-only layout may redirect to /dashboard before
        // the placements layout renders a forbidden/404 state. Either
        // outcome must protect the private placement context.
        await expect(page).not.toHaveURL(/\/learn\/my-placements\/schedule/);
        await expect(page.getByText("My Placements", { exact: true })).toHaveCount(0);
        await expect(page.getByText("E2E Prototype Software Engineer")).toHaveCount(0);
      }
    });

  for (const viewport of [
    { name: "desktop", width: 1280, height: 800 },
    { name: "mobile", width: 390, height: 844 },
  ] as const) {
    test(viewport.name+" calendar and interview bookmarks preserve only safe filters",
      async ({ page, context }, info) => {
        test.setTimeout(120000);
        await page.setViewportSize(viewport);
        await authenticateGracefulRole(context, "learner");
        const job = "81818181-8181-4818-8818-818181818181";
        const round = "83838383-8383-4838-8838-838383838383";

        const calendar = new URL("http://localhost:3000/learn/my-placements/calendar");
        calendar.searchParams.set("view", "month");
        calendar.searchParams.set("date", "2026-11-12");
        calendar.searchParams.set("jobId", job);
        calendar.searchParams.set("roundId", round);
        calendar.searchParams.set("kind", "INTERVIEW");
        calendar.searchParams.set("collegeId", "forbidden-override");
        await page.goto(calendar.href);
        await expect(page).toHaveURL(/\/learn\/my-placements\/schedule\?view=calendar/);
        const c = new URL(page.url());
        expect(c.searchParams.get("view")).toBe("calendar");
        expect(c.searchParams.get("date")).toBe("2026-11-12");
        expect(c.searchParams.get("jobId")).toBe(job);
        expect(c.searchParams.get("roundId")).toBe(round);
        expect(c.searchParams.get("kind")).toBe("INTERVIEW");
        expect(c.searchParams.has("collegeId")).toBe(false);
        expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth))
          .toBeLessThanOrEqual(2);
        await page.screenshot({
          path: info.outputPath("ux-g063-calendar-"+viewport.name+".png"), fullPage: true,
        });

        const interviews = new URL("http://localhost:3000/learn/my-placements/interviews");
        interviews.searchParams.set("view", "ahead");
        interviews.searchParams.set("q", "  candidate discussion  ");
        interviews.searchParams.set("applicationId", job);
        interviews.searchParams.set("roundId", "not-a-uuid");
        interviews.searchParams.set("membershipId", "foreign");
        await page.goto(interviews.href);
        await expect(page).toHaveURL(/\/learn\/my-placements\/schedule\?view=upcoming/);
        const i = new URL(page.url());
        expect(i.searchParams.get("view")).toBe("upcoming");
        expect(i.searchParams.get("q")).toBe("candidate discussion");
        expect(i.searchParams.get("applicationId")).toBe(job);
        expect(i.searchParams.has("roundId")).toBe(false);
        expect(i.searchParams.has("membershipId")).toBe(false);
        expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth))
          .toBeLessThanOrEqual(2);
        await page.screenshot({
          path: info.outputPath("ux-g063-interviews-"+viewport.name+".png"), fullPage: true,
        });
      });
  }
});
