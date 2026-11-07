import { expect, test } from "@playwright/test";

/**
 * UX-G068, UX-G051, UX-G085: public journeys only, no live login or email.
 * Intercept the safe dashboard landing instead of touching real user data.
 */
const viewports = [
  { name: "desktop", width: 1280, height: 800 },
  { name: "mobile", width: 390, height: 844 },
] as const;

async function noHorizontalOverflow(page: import("@playwright/test").Page) {
  expect(await page.evaluate(() =>
    document.documentElement.scrollWidth > window.innerWidth
  )).toBe(false);
}

for (const viewport of viewports) {
  test(`UX-G068 ${viewport.name} maintenance is accessible, explicit and safely retryable`,
    async ({ page, context }) => {
      await page.setViewportSize(viewport);
      const pageErrors: string[] = [];
      page.on("pageerror", err => pageErrors.push(err.message));
      await page.goto("/maintenance");
      await expect(page.getByRole("heading", { level: 1, name: "42LMS is temporarily unavailable" })).toBeVisible();
      const retry = page.getByRole("button", { name: "Try again" });
      await expect(retry).toBeVisible();
      await expect(page.getByRole("link", { name: "Return to sign in" })).toHaveAttribute("href", "/login");
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
      await noHorizontalOverflow(page);
      await retry.focus();
      await expect(retry).toBeFocused();

      await context.setOffline(true);
      try {
        await retry.click();
        await expect(page.getByRole("status")).toContainText(/You're offline/);
        await expect(page.locator("main").getByText(/Reconnect to the internet before checking again/)).toBeVisible();
        await expect(page).toHaveURL(/\/maintenance$/);
      } finally {
        await context.setOffline(false);
      }

      await page.route("**/dashboard", route => route.fulfill({
        status: 200, contentType: "text/html",
        body: "<!doctype html><html lang='en'><title>Workspace</title><body><h1>Workspace reached</h1></body></html>",
      }));
      await retry.click();
      await expect(page).toHaveURL(/\/dashboard$/);
      await expect(page.getByRole("heading", { name: "Workspace reached" })).toBeVisible();
      expect(pageErrors).toEqual([]);
    });

  test(`UX-G051 ${viewport.name} forbidden page explains denial with safe account recovery`,
    async ({ page }) => {
      await page.setViewportSize(viewport);
      const pageErrors: string[] = [];
      page.on("pageerror", err => pageErrors.push(err.message));
      await page.goto("/forbidden");
      await expect(page.getByRole("heading", { level: 1, name: "You don't have access to this page" })).toBeVisible();
      await expect(page.locator("main").getByText(/account or selected workspace/)).toBeVisible();
      const home = page.getByRole("link", { name: "Go to my workspace" });
      const alternate = page.getByRole("link", { name: "Sign in with another account" });
      await expect(home).toHaveAttribute("href", "/dashboard");
      await expect(alternate).toHaveAttribute("href", "/login");
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
      await noHorizontalOverflow(page);
      await alternate.focus();
      await expect(alternate).toBeFocused();
      // The anonymous browser cannot resolve an authenticated dashboard.
      // Test the real public fallback, while the workspace destination above
      // is contract-checked as a fixed same-origin href.
      await alternate.click();
      await expect(page).toHaveURL(/\/login$/);
      await expect(page.getByRole("tab", { name: "Email" })).toBeVisible();
      expect(pageErrors).toEqual([]);
    });

  test(`UX-G085 ${viewport.name} demo preserves email CTA with accessible copy fallback`,
    async ({ page }) => {
      await page.setViewportSize(viewport);
      const pageErrors: string[] = [];
      page.on("pageerror", err => pageErrors.push(err.message));
      await page.addInitScript(() => {
        Object.defineProperty(navigator, "clipboard", {
          configurable: true,
          value: {
            writeText: async (value: string) => {
              (window as Window & { __copiedEmail?: string }).__copiedEmail = value;
            },
          },
        });
      });
      await page.goto("/request-demo");
      await expect(page.getByRole("heading", { level: 1, name: "See 42 LMS in action" })).toBeVisible();
      const cta = page.getByRole("link", { name: /Email us to book a demo/ });
      await expect(cta).toHaveAttribute("href", /^mailto:hello@42lms\.com\?subject=/);
      const copy = page.getByRole("button", { name: "Copy email address" });
      await expect(copy).toBeVisible();
      await copy.focus();
      await expect(copy).toBeFocused();
      await copy.click();
      await expect(page.getByRole("status")).toContainText("Email address copied");
      expect(await page.evaluate(() => (window as Window & { __copiedEmail?: string }).__copiedEmail))
        .toBe("hello@42lms.com");
      await expect(page.getByRole("link", { name: "hello@42lms.com" }))
        .toHaveAttribute("href", "mailto:hello@42lms.com");
      await noHorizontalOverflow(page);
      expect(pageErrors).toEqual([]);
    });
}

test("UX-G085 denied clipboard permission gives an actionable manual fallback", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async () => { throw new Error("Not allowed"); } },
    });
  });
  await page.goto("/request-demo");
  await page.getByRole("button", { name: "Copy email address" }).click();
  await expect(page.getByRole("status")).toContainText("Select the address below");
  await expect(page.getByRole("link", { name: "hello@42lms.com" })).toBeVisible();
});
