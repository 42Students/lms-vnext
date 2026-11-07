import { expect, test } from "@playwright/test";

/**
 * UX-G075: isolated browser acceptance. The destination is intercepted so no
 * real account/authentication request is made, and no private data is loaded.
 */
for (const viewport of [
  { name: "desktop", width: 1280, height: 800 },
  { name: "mobile", width: 390, height: 844 },
] as const) {
  test(`UX-G075 ${viewport.name}: public offline recovery is usable and does not loop`,
    async ({ page, context }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      const failures: string[] = [];
      page.on("pageerror", error => failures.push(error.message));
      await page.goto("/offline");

      const retry = page.getByRole("button", { name: "Try again" });
      await expect(retry).toBeVisible();
      await expect(page.getByRole("heading", { level: 1, name: "Ready to reconnect" })).toBeVisible();
      await expect(page.getByRole("link", { name: "Return to sign in" }))
        .toHaveAttribute("href", "/login");
      await expect(page).toHaveTitle(/Offline.*42LMS/i);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/i);
      await retry.focus();
      await expect(retry).toBeFocused();
      expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth))
        .toBe(false);

      await context.setOffline(true);
      try {
        await expect(page.getByRole("heading", { level: 1, name: "You're offline" })).toBeVisible();
        await retry.click();
        await expect(page.getByRole("status")).toContainText(/Still offline/i);
        await expect(page.getByText(/Still offline\. Check Wi-Fi/)).toBeVisible();
        await expect(page).toHaveURL(/\/offline$/);
      } finally {
        await context.setOffline(false);
      }

      await expect(page.getByRole("heading", { name: "Ready to reconnect" })).toBeVisible();
      await page.route("**/dashboard", route => route.fulfill({
        status: 200,
        contentType: "text/html",
        body: "<!doctype html><html lang='en'><title>Workspace reached</title><body><h1>Workspace reached</h1></body></html>",
      }));
      await retry.click();
      await expect(page).toHaveURL(/\/dashboard$/);
      await expect(page.getByRole("heading", { name: "Workspace reached" })).toBeVisible();
      expect(failures).toEqual([]);
    });
}
