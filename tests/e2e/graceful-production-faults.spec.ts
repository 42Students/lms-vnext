import { expect, test } from "@playwright/test";
import {
  captureUncaughtErrors, expectFriendlyFailure, expectNoRawErrors, failApi,
  type FailureKind,
} from "./support/no-raw-error";

/**
 * GR-80/82 production-only browser gates. These must run with a separately
 * built application and must not be interpreted as development-server proof.
 */
const productionBase = process.env.GRACEFUL_PRODUCTION_BASE_URL;

test.describe("GR-80 GR-82 production sign-in fault recovery", () => {
  test.skip(!productionBase, "GR-82 requires an independently built production origin");

  for (const kind of ["forbidden", "rate-limit", "maintenance", "slow"] as FailureKind[]) {
    test(`GR-80 GR-82 production sign-in ${kind} keeps contact and offers retry`, async ({ page }) => {
      test.setTimeout(45_000);
      await page.goto(new URL("/", productionBase!).toString());
      await page.getByRole("tab", { name: "Email" }).click();
      const email = page.getByRole("textbox", { name: "Email" });
      await email.fill("learner.a@vnext.test");
      const errors = captureUncaughtErrors(page);
      const fault = await failApi(page, "**/api/auth/login/start", kind);
      try {
        await page.getByRole("button", { name: "Continue" }).click();
        await expect.poll(() => fault.requests().includes("POST /api/auth/login/start")).toBe(true);
        await expectFriendlyFailure(page, kind);
        await expect(email).toHaveValue("learner.a@vnext.test");
        await expect(page.getByRole("button", { name: "Continue" })).toBeEnabled();
        await expectNoRawErrors(page);
        expect(errors).toEqual([]);
      } finally {
        await fault.dispose();
      }
    });
  }

  test("GR-82 production denies source maps for every initial application chunk", async ({ page, request }) => {
    test.setTimeout(90_000); // A production page can reference many chunks; probe every one.
    await page.goto(new URL("/", productionBase!).toString());
    const scripts = await page.locator("script[src]").evaluateAll((elements) =>
      elements.map((node) => (node as HTMLScriptElement).src)
        .filter((src) => {
          const pathname = new URL(src).pathname;
          return pathname.includes("/_next/static/chunks/") && pathname.endsWith(".js");
        }),
    );
    const unique = [...new Set(scripts)];
    expect(unique.length, "GR-82 requires genuine production application chunks").toBeGreaterThan(0);
    for (const src of unique) {
      const url = new URL(src);
      url.search = "";
      url.hash = "";
      const response = await request.get(url.toString() + ".map", { failOnStatusCode: false });
      expect(response.status(), `GR-82 leaked source map for ${url.pathname}`).toBe(404);
    }
    await expectNoRawErrors(page);
  });
});
