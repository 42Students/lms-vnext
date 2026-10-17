import { existsSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { captureUncaughtErrors, expectNoRawErrors } from "./support/no-raw-error";

/**
 * GR-80/GR-82: The orchestrator signs each test identity into a disposable
 * production-build staging deployment, then supplies local Playwright
 * storage-state files outside the repository. These files can contain cookies;
 * never commit, print, or generate them from development E2E bypass tokens.
 */
const base = process.env.GRACEFUL_PRODUCTION_BASE_URL;
const sessions = process.env.GRACEFUL_PRODUCTION_AUTH_STORAGE_DIR;

const roles = [
  { role: "learner", route: "/learn/my-placements" },
  { role: "faculty", route: "/teacher/courses" },
  { role: "mentor", route: "/mentor/projects" },
  { role: "college", route: "/college/departments" },
  { role: "tpo", route: "/tpo/recruiters" },
  { role: "recruiter", route: "/hr/profile" },
  { role: "superadmin", route: "/admin/organizations" },
] as const;

for (const { role, route } of roles) {
  test(`GR-80 GR-82 ${role} production stale chunk reload stays branded and usable`,
    async ({ browser }) => {
      test.setTimeout(45_000);
      test.skip(!base || !sessions,
        "Needs externally signed-in isolated production build and role storage-state files");
      const state = path.join(sessions!, role + ".json");
      test.skip(!existsSync(state), "GR-80: missing externally authenticated " + role + " storage state");
      const context = await browser.newContext({ storageState: state, baseURL: base! });
      try {
        const page = await context.newPage();
        const errors = captureUncaughtErrors(page);
        let failures = 0;
        let navigations = 0;
        page.on("framenavigated", frame => {
          if (frame === page.mainFrame()) navigations += 1;
        });
        await page.route("**/_next/static/chunks/**", async route => {
          if (failures === 0) {
            failures += 1;
            await route.fulfill({
              status: 404, contentType: "text/plain", body: "stale deployment chunk",
            });
            return;
          }
          await route.continue();
        });
        await page.goto(route);
        await expect.poll(() => failures).toBe(1);
        await expect.poll(() => navigations, { timeout: 25_000 }).toBeGreaterThanOrEqual(2);
        await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
        await expect(page.locator("nextjs-portal")).toHaveCount(0);
        await expectNoRawErrors(page);
        expect(errors.filter(message =>
          !/ChunkLoadError|Loading chunk failed|dynamically imported module/i.test(message)))
          .toEqual([]);
      } finally {
        await context.close();
      }
    });
}
