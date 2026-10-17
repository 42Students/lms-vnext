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
    await expect(page.getByRole("heading", { name: /sign in|42LMS/i }).first()).toBeVisible();
    await expect(page.locator("nextjs-portal")).toHaveCount(0);
    await expect(page.getByText(/Application error: a client-side exception has occurred/i)).toHaveCount(0);
    await expectNoRawErrors(page);
    expect(errors).toEqual([]);
  });

  test("GR-82 unknown public URL has a home link and no framework error", async ({ page }) => {
    await page.goto(new URL("/this-is-not-an-lms-page-gr82", productionBase!).toString());
    await expect(page.getByRole("heading", { name: /Page not found/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /go to home/i })).toBeVisible();
    await expectNoRawErrors(page);
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

  test("GR-82 HTML 502 from the login API is never rendered as a proxy page", async ({ page }) => {
    await page.goto(productionBase!);
    await page.getByRole("tab", { name: "Email" }).click();
    await page.getByRole("textbox", { name: "Email" }).fill("learner.a@vnext.test");
    const fault = await failApi(page, "**/api/auth/login/start", "html-502");
    try {
      await page.getByRole("button", { name: "Continue" }).click();
      await expect.poll(() => fault.requests().includes("POST /api/auth/login/start")).toBe(true);
      await expect(page.getByRole("alert")).toContainText(
        "Something went wrong on our side. Please try again in a moment.",
      );
      await expect(page.getByText("502 Bad Gateway")).toHaveCount(0);
      await expectNoRawErrors(page);
    } finally {
      await fault.dispose();
    }
  });

  test("GR-82 production JSON 500 shows a reference id, never the raw provider response", async ({ page }) => {
    await page.goto(productionBase!);
    const emailTab = page.getByRole("tab", { name: "Email" });
    await emailTab.click();
    await page.getByRole("textbox", { name: "Email" }).fill("learner.a@vnext.test");
    const failure = await failApi(page, "**/api/auth/login/start", "json-500");
    try {
      await page.getByRole("button", { name: "Continue" }).click();
      await expect.poll(failure.hits).toBeGreaterThan(0);
      await expect(page.getByText(/Reference:\s*[a-z0-9]{8}\b/i).first()).toBeVisible();
      await expect(page.getByRole("button", { name: /copy reference/i }).first()).toBeVisible();
      await expectNoRawErrors(page);
    } finally {
      await failure.dispose();
    }
  });

  test("GR-80 GR-82 stale chunk recovers without an overlay or a permanently blank page", async ({ page }) => {
    test.setTimeout(35_000);
    const errors = captureUncaughtErrors(page);
    let failures = 0;
    let navigations = 0;
    page.on("framenavigated", (frame) => { if (frame === page.mainFrame()) navigations += 1; });
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
    await expect.poll(() => failures).toBe(1);
    // Hydration must actually recover. A server-rendered heading with broken
    // JavaScript is not success; a second navigation proves the one-time reload.
    await expect.poll(() => navigations, { timeout: 20_000 }).toBeGreaterThanOrEqual(2);
    await expect(page.getByRole("heading", { name: /sign in|42LMS/i }).first()).toBeVisible();
    const tab = page.getByRole("tab", { name: "Email" });
    await tab.click();
    await expect(tab).toHaveAttribute("aria-selected", "true");
    await expectNoRawErrors(page);
    expect(errors.filter((entry) => !/ChunkLoadError|Loading chunk failed|dynamically imported module/i.test(entry)))
      .toEqual([]);
  });
});
