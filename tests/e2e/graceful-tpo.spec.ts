import { expect, test } from "@playwright/test";
import { authenticateGracefulRole } from "./support/roles";
import { captureUncaughtErrors, expectNoRawErrors, failApi, type FailureKind } from "./support/no-raw-error";

const journeys = [
  { title: "recruiter roster", route: "/tpo/recruiters", endpoint: /\/api\/placements\/tpo\/leads\?/ },
  { title: "company directory", route: "/tpo/recruiters?view=companies", endpoint: /\/api\/placements\/tpo\/companies\?/ },
] as const;
const kinds: FailureKind[] = [
  "backend-down", "html-502", "json-500", "forbidden",
  "missing-record", "conflict", "rate-limit", "slow", "session-expired",
];

test.describe("GR-80 TPO client-side roster and company directory failures", () => {
  test.skip(!process.env.E2E_AUTH_SECRET || process.env.E2E_AUTH_ENABLED !== "true",
    "Needs development E2E harness plus seed-test-tenants TPO account");

  for (const journey of journeys) {
    for (const kind of kinds) {
      test(`GR-80 TPO ${journey.title} ${kind} shows a recoverable failure`, async ({ page, context }) => {
        test.setTimeout(35_000);
        await authenticateGracefulRole(context, "tpo");
        const failure = await failApi(page, kind === "backend-down" ? "**/api/**" : journey.endpoint, kind);
        try {
          await page.goto(journey.route);
          const errors = captureUncaughtErrors(page);
          await expect.poll(failure.hits).toBeGreaterThan(0);
          await expect(page.getByRole("alert").first()).toContainText(
            /try again|could not load|temporarily|unavailable|retry|sign in|access/i,
            { timeout: 15_000 },
          );
          await expectNoRawErrors(page);
          expect(errors).toEqual([]);
        } finally {
          await failure.dispose();
        }
      });
    }
  }

  test("GR-80 TPO offline roster displays recovery and reconnects", async ({ page, context }) => {
    await authenticateGracefulRole(context, "tpo");
    await page.goto("/tpo/recruiters");
    await expect(page.getByRole("heading", { name: "Engage" })).toBeVisible();
    await context.setOffline(true);
    try {
      // Do not navigate while offline: a browser-native network error page
      // cannot be branded by the app without a pre-cached service worker.
      // Exercise the already loaded workspace and its offline banner instead.
      await expect(page.getByText(/offline|connection|reconnect/i).first()).toBeVisible();
      await expectNoRawErrors(page);
    } finally {
      await context.setOffline(false);
    }
  });
});
