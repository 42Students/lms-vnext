import { readFile } from "node:fs/promises";
import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { SEED_IDS } from "../../scripts/db-seed-data";

const origin = "http://localhost:3000";
const enabled = process.env.APP_ENV === "development" &&
  process.env.E2E_AUTH_ENABLED === "true" && Boolean(process.env.AUTH_TEST_OTP);

/** Exercise the normal OTP challenge, verifier, device cookie and persisted role choice.
 * A test-identity cookie is intentionally NOT set: it cannot satisfy step-up.
 */
async function authenticateRealMentor(context: BrowserContext) {
  const code = process.env.AUTH_TEST_OTP;
  expect(code, "Development-only OTP fixture must be configured").toMatch(/^\d{6}$/);
  await context.clearCookies();
  const start = await context.request.post(origin + "/api/auth/login/start", {
    headers: {origin},
    data: {channel: "EMAIL", contact: "faculty.seed@example.com"},
  });
  expect(start.status(), "OTP challenge must be created").toBe(200);
  const challenge = await start.json() as {
    attemptId: string; requiresSecondFactor: boolean;
  };
  expect(challenge.requiresSecondFactor).toBe(false);
  const verify = await context.request.post(origin + "/api/auth/login/verify", {
    headers: {origin}, data: {attemptId: challenge.attemptId, code},
  });
  expect(verify.status(), "Real OTP verification creates a device session").toBe(200);
  expect((await context.cookies(origin)).some(cookie => cookie.name === "lms_session"))
    .toBe(true);
  const selected = await context.request.post(origin + "/api/auth/memberships", {
    headers: {origin},
    data: {membershipId: SEED_IDS.facultyCollegeAMembership, role: "MENTOR"},
  });
  expect(selected.status(), "MENTOR must be a persisted college-A grant").toBe(200);
}

async function assignedProjectId(page: Page): Promise<string> {
  await page.goto("/mentor/projects");
  const link = page.getByRole("link", {name: /E2E Mentor Acceptance Project/}).first();
  await expect(link).toBeVisible({timeout: 20000});
  const href = await link.getAttribute("href");
  const found = href?.match(/\/mentor\/projects\/([0-9a-f-]{36})(?:[/?#]|$)/i);
  expect(found, "The actual authorized project link supplies the fixture ID").toBeTruthy();
  return found![1]!;
}

const scenarios = [
  {id: "calendar", path: "/api/mentor/calendar/export", header: "Meeting ID,Project,Meeting,Status,Start (IST),End (IST)"},
  {id: "task-history", path: "/api/mentor/task-review-history/export", header: "Review ID,Project,Task,Version,Decision,Reviewed (IST)"},
  {id: "portfolio-activity", path: "/api/mentor/activity/export", header: "Event ID,Project,Recorded event,Importance,Occurred (IST)"},
  {id: "reviews", path: "/api/mentor/reviews/export", header: "Project ID,Assigned project,Review needed,Submitted (IST)"},
] as const;

test.describe("UX-G182 genuinely OTP-authenticated Mentor export APIs", () => {
  // A challenge and its device session are deliberately consumed sequentially.
  test.describe.configure({mode: "serial"});
  test.skip(!enabled, "Requires development-only OTP, isolated PostgreSQL and seeded Mentor project");

  for (const viewport of [
    {name: "desktop", width: 1280, height: 800},
    {name: "mobile", width: 390, height: 844},
  ] as const) {
    test("recent OTP session downloads all five scoped exports at " + viewport.name,
      async ({page, context}, info) => {
        test.setTimeout(180000);
        await authenticateRealMentor(context);
        await page.setViewportSize(viewport);
        const projectId = await assignedProjectId(page);
        const endpoints = [...scenarios, {
          id: "project-activity" as const,
          path: "/api/projects/" + projectId + "/mentor-activity-export",
          header: "Event ID,Recorded event,Importance,Occurred (IST)",
        }];
        for (const item of endpoints) {
          const response = await page.request.get(item.path);
          expect(response.status(), item.id + " must accept the fresh OTP device").toBe(200);
          expect(response.headers()["content-type"], item.id).toContain("text/csv");
          expect(response.headers()["content-disposition"], item.id).toContain("attachment;");
          expect(response.headers()["cache-control"], item.id).toContain("no-store");
          expect(Number(response.headers()["x-export-omitted"]), item.id).toBeGreaterThanOrEqual(0);
          const body = await response.text();
          expect(body.startsWith("\uFEFF" + item.header), item.id + " exported CSV columns").toBe(true);
          expect(body).not.toMatch(/actorEmail|joinUrl|learner_email|reviewNotes|phoneE164/);
        }

        // A real Chromium download, not a synthetic data: URL or response mock.
        const actualDownload = page.waitForEvent("download");
        await page.evaluate((href) => {
          const link = document.createElement("a");
          link.href = href;
          document.body.append(link);
          link.click();
          link.remove();
        }, "/api/mentor/calendar/export");
        const downloaded = await actualDownload;
        expect(downloaded.suggestedFilename()).toBe("mentor-meetings-calendar.csv");
        const file = await downloaded.path();
        expect(file).toBeTruthy();
        expect((await readFile(file!, "utf8")).startsWith(
          "\uFEFFMeeting ID,Project,Meeting,Status,Start (IST),End (IST)",
        )).toBe(true);
        expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth))
          .toBeLessThanOrEqual(2);
        await page.screenshot({
          path: info.outputPath("g182-real-mentor-" + viewport.name + ".png"),
          fullPage: true,
        });
      });
  }

  test("an authenticated college-B faculty membership cannot export the college-A Mentor project",
    async ({page, context}) => {
      test.setTimeout(120000);
      await authenticateRealMentor(context);
      const projectId = await assignedProjectId(page);
      const switched = await context.request.post(origin + "/api/auth/memberships", {
        headers: {origin},
        data: {membershipId: SEED_IDS.facultyCollegeBMembership, role: "FACULTY"},
      });
      expect(switched.status(), "The other college membership must actually be selected").toBe(200);
      for (const path of [
        "/api/projects/" + projectId + "/mentor-activity-export",
        "/api/mentor/calendar/export",
      ]) {
        const denied = await page.request.get(path);
        expect([401,403,404], "Cross-role/college scope must fail closed: " + path)
          .toContain(denied.status());
        expect(denied.headers()["content-type"] ?? "").not.toContain("text/csv");
        expect(denied.headers()["content-disposition"] ?? "").not.toContain("attachment");
      }
    });
});
