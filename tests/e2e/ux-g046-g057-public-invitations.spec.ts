import { expect, test } from "@playwright/test";

test.describe("UX-G046 company join", () => {
  test("invalid link stays non-interactive on desktop and 320px mobile", async ({ page }, info) => {
    let joins = 0;
    await page.route("**/api/public/company-join/**", async route => {
      joins++;
      await route.fulfill({ status: 503, contentType: "application/json", body: '{}' });
    });
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/company-join/short");
    await expect(page.getByRole("heading", { name: "This link is no longer valid" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login");
    await expect(page.getByRole("button", { name: "Send me a code" })).toHaveCount(0);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page.locator('meta[name="referrer"]')).toHaveAttribute("content", "no-referrer");
    expect(joins).toBe(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath("company-invalid-desktop.png"), fullPage: true });

    await page.setViewportSize({ width: 320, height: 720 });
    await expect(page.getByRole("heading", { name: "This link is no longer valid" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath("company-invalid-mobile.png"), fullPage: true });
  });
});

test.describe("UX-G057 legacy HR invitation", () => {
  test("valid alias redirects only to the canonical first-party recruiter invitation", async ({ page }, info) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/hr-invite/abcdefgh1234");
    await expect(page).toHaveURL(/\/recruiter-invite\/abcdefgh1234(?:\?.*)?$/);
    expect(new URL(page.url()).origin).toBe("http://localhost:3000");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page.locator('meta[name="referrer"]')).toHaveAttribute("content", "no-referrer");
    await page.screenshot({ path: info.outputPath("hr-canonical-desktop.png"), fullPage: true });
  });

  test("short malformed alias returns not-found without redirecting or exposing a token", async ({ page }, info) => {
    await page.setViewportSize({ width: 375, height: 812 });
    // Next App Router may stream a semantic not-found view with an initial 200.
    // Assert the real denied UX and unchanged destination, not its shell status.
    await page.goto("/hr-invite/short");
    await expect(page).toHaveURL(/\/hr-invite\/short$/);
    await expect(page.getByRole("heading", { name: /Page Not Found/i })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath("hr-invalid-mobile.png"), fullPage: true });
  });
});
