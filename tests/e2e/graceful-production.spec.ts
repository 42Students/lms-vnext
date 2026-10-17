import { expect, test } from "@playwright/test";
import { captureUncaughtErrors, expectNoRawErrors, failApi } from "./support/no-raw-error";

// The default playwright.config.ts serves `npm run dev`, not a production build.
// The orchestrator must supply an independently built `next start` endpoint.
const productionBase = process.env.GRACEFUL_PRODUCTION_BASE_URL;

test.describe("GR-82 production failure smoke", () => {
  test.skip(!productionBase, "Set GRACEFUL_PRODUCTION_BASE_URL to a real production-build URL; never use npm run dev");

  test("GR-82 sign-in is branded and contains no Next.js developer overlay", async ({ page }) => {
    const errors = captureUncaughtErrors(page);
    await page.goto(productionBase!);
    await expect(page.getByRole("heading", { name: /LMS vNext|sign in/i }).first()).toBeVisible();
    await expect(page.locator("nextjs-portal")).toHaveCount(0);
    await expect(page.getByText(/Application error: a client-side exception has occurred/i)).toHaveCount(0);
    await expectNoRawErrors(page);
    expect(errors).toEqual([]);
  });

  test("GR-82 production does not serve JavaScript source maps", async ({ page, request }) => {
    await page.goto(productionBase!);
    const javascript = await page.locator("script[src]").evaluateAll((scripts) =>
      scripts.map((node) => (node as HTMLScriptElement).src)
        .find((src) => src.includes("/_next/static/chunks/") && src.endsWith(".js")),
    );
    expect(javascript, "Expected a real deployed Next.js static chunk").toBeTruthy();
    const url = new URL(javascript!);
    url.search = "";
    const response = await request.get(url.toString() + ".map", { failOnStatusCode: false });
    expect(response.status(), "Production must not expose source maps").toBe(404);
  });

  test("GR-82 production JSON 500 shows a reference id, never the raw provider response", async ({ page }) => {
    await page.goto(productionBase!);
    const emailTab = page.getByRole("tab", { name: "Email" });
    await emailTab.click();
    await page.getByRole("textbox", { name: "Email address" }).fill("learner.a@vnext.test");
    const failure = await failApi(page, "**/api/auth/login/start", "json-500");
    try {
      await page.getByRole("button", { name: "Send code" }).click();
      await expect.poll(failure.hits).toBeGreaterThan(0);
      await expect(page.getByText(/Reference:\s*[a-z0-9]{8}\b/i).first()).toBeVisible();
      await expect(page.getByRole("button", { name: /copy reference/i }).first()).toBeVisible();
      await expectNoRawErrors(page);
    } finally {
      await failure.dispose();
    }
  });

  test("GR-82 stale chunk recovers without an overlay or a permanently blank page", async ({ page }) => {
    test.setTimeout(35_000);
    const errors = captureUncaughtErrors(page);
    let failures = 0;
    await page.route("**/_next/static/chunks/**", async (route) => {
      // Fail only the first chunk to allow the one-time version recovery reload.
      if (failures === 0) {
        failures += 1;
        await route.fulfill({ status: 404, body: "missing deploy chunk", contentType: "text/plain" });
      } else {
        await route.continue();
      }
    });
    await page.goto(productionBase!);
    await expect.poll(() => failures).toBeGreaterThan(0);
    await expect(page.getByText(/new version is available|reloading|sign in|try again/i).first())
      .toBeVisible({ timeout: 20_000 });
    await expectNoRawErrors(page);
    expect(errors).toEqual([]);
  });
});
