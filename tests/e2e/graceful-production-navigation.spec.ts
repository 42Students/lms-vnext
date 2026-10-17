import { existsSync } from "node:fs";
import path from "node:path";
import { expect, test, type Browser, type BrowserContext } from "@playwright/test";
import { captureUncaughtErrors, expectNoRawErrors } from "./support/no-raw-error";

/**
 * GR-80/GR-82: exercise real production error links and offline recovery.
 * Unlike development bypass cookies, these role states come from the
 * orchestrator's independent first-party staging logins.
 */
const baseURL = process.env.GRACEFUL_PRODUCTION_BASE_URL;
const sessionDirectory = process.env.GRACEFUL_PRODUCTION_AUTH_STORAGE_DIR;
const unknownId = "00000000-0000-4000-8000-000000000000";

const journeys = [
  { role: "public", route: "/", missing: "/this-is-not-an-lms-page-gr80" },
  { role: "learner", route: "/learn/my-placements", missing: "/learn/courses/" + unknownId },
  { role: "faculty", route: "/teacher/courses", missing: "/teacher/courses/" + unknownId + "/home" },
  { role: "mentor", route: "/mentor/projects", missing: "/mentor/projects/" + unknownId },
  { role: "college", route: "/college/departments", missing: "/college/students/" + unknownId },
  { role: "tpo", route: "/tpo/recruiters", missing: "/tpo/recruiters/" + unknownId },
  { role: "recruiter", route: "/hr/profile", missing: "/hr/drives/" + unknownId },
  { role: "superadmin", route: "/admin/organizations", missing: "/admin/colleges/" + unknownId },
] as const;

const layouts = [
  { name: "desktop", width: 1280, height: 850 },
  { name: "mobile", width: 390, height: 844 },
] as const;

async function stagingContext(
  browser: Browser, journey: (typeof journeys)[number],
): Promise<BrowserContext> {
  if (journey.role === "public") return browser.newContext({ baseURL: baseURL! });
  const state = path.join(sessionDirectory!, journey.role + ".json");
  return browser.newContext({ baseURL: baseURL!, storageState: state });
}

function available(journey: (typeof journeys)[number]): boolean {
  if (!baseURL) return false;
  if (journey.role === "public") return true;
  return Boolean(sessionDirectory && existsSync(path.join(sessionDirectory, journey.role + ".json")));
}

for (const journey of journeys) {
  for (const layout of layouts) {
    test(
      "GR-80 GR-82 " + journey.role + " " + layout.name +
        " production offline notice clears and restores page",
      async ({ browser }) => {
        test.setTimeout(45_000);
        test.skip(!available(journey),
          "GR-80 GR-82 requires production build and first-party role session: " + journey.role);
        const context = await stagingContext(browser, journey);
        try {
          const page = await context.newPage();
          await page.setViewportSize({ width: layout.width, height: layout.height });
          const errors = captureUncaughtErrors(page);
          await page.goto(journey.route);
          await expect.poll(
            () => new URL(page.url()).pathname,
            { message: "GR-80 must have opened the intended staging role page" },
          ).toBe(journey.route);
          await expectNoRawErrors(page);
          const banner = page.getByRole("alert")
            .filter({ hasText: "You appear to be offline. Check your connection and try again." });
          await expect(banner).toHaveCount(0);
          await context.setOffline(true);
          try {
            await expect(banner.first()).toBeVisible({ timeout: 10_000 });
            await expectNoRawErrors(page);
          } finally {
            await context.setOffline(false);
          }
          await expect(banner).toHaveCount(0);
          await expectNoRawErrors(page);
          expect(errors, "GR-80: offline/online must not throw in the browser").toEqual([]);
        } finally {
          await context.close();
        }
      },
    );

    test(
      "GR-80 GR-82 " + journey.role + " " + layout.name +
        " unknown record shows branded link and returns home",
      async ({ browser }) => {
        test.setTimeout(45_000);
        test.skip(!available(journey),
          "GR-80 GR-82 requires production build and first-party role session: " + journey.role);
        const context = await stagingContext(browser, journey);
        try {
          const page = await context.newPage();
          await page.setViewportSize({ width: layout.width, height: layout.height });
          const errors = captureUncaughtErrors(page);
          await page.goto(journey.route);
          await expect.poll(
            () => new URL(page.url()).pathname,
            { message: "GR-80 must confirm role authentication before testing a missing record" },
          ).toBe(journey.route);
          await page.goto(journey.missing);
          await expect(page.getByText(
            /not found|no longer available|could not find|does not exist|doesn't exist/i,
          ).first()).toBeVisible();
          const back = page.getByRole("link", { name: /home|back|dashboard|return/i }).first();
          await expect(back).toBeVisible();
          const href = await back.getAttribute("href");
          expect(href, "GR-80 recovery must stay inside the LMS").toMatch(/^\/(?!\/)/);
          await expectNoRawErrors(page);
          await back.click();
          await expect.poll(
            () => new URL(page.url()).pathname,
            { message: "GR-80 recovery link must escape the nonexistent record" },
          ).not.toBe(journey.missing);
          await expectNoRawErrors(page);
          expect(errors, "GR-82: missing links must not cause runtime exceptions").toEqual([]);
        } finally {
          await context.close();
        }
      },
    );
  }
}
