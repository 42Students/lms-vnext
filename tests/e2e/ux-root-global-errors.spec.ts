import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

/**
 * UX-G185: exercise the actual App Router root error boundary using a
 * development-only fixture. UX-G186: exercise the exact self-contained
 * global stylesheet without loading the normal app stylesheet or layout.
 */
const viewports = [
  { name: "desktop", width: 1280, height: 800 },
  { name: "mobile", width: 390, height: 844 },
] as const;
const globalSource = readFileSync("src/app/global-error.tsx", "utf8");
const fallbackCss = /const fallbackCss = `([\s\S]*?)`;/m.exec(globalSource)?.[1];
if (!fallbackCss) throw new Error("Global error emergency CSS is missing");

for (const viewport of viewports) {
  test(`UX-G185 ${viewport.name} genuine root error provides safe support recovery`,
    async ({ page, context }) => {
      await page.setViewportSize(viewport);
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);
      const sanitizedReports: Record<string, unknown>[] = [];
      await page.route("**/api/client-errors", async route => {
        const payload = route.request().postDataJSON() as Record<string, unknown>;
        sanitizedReports.push(payload);
        await route.fulfill({ status: 204 });
      });
      await page.goto("/e2e/ux-root-error-fixture");
      const rootError = page.locator('main[data-root-error="true"]');
      await expect(rootError).toBeVisible({ timeout: 25000 });
      // React development overlay is not part of the product recovery screen.
      // The fallback itself must never expose the synthetic thrown exception.
      await expect(rootError).not.toContainText("SYNTHETIC_TEST_ERROR_DO_NOT_DISPLAY");
      await expect(rootError.getByRole("heading", { level: 1, name: "500" })).toBeVisible();
      await expect(rootError.getByRole("heading", { name: "Server Error" })).toBeVisible();
      await expect(rootError.getByRole("button", { name: "Try again" })).toBeVisible();
      await expect(rootError.getByRole("link", { name: "Go to Home" }))
        .toHaveAttribute("href", "/");
      await expect(rootError.locator("#root-error-status")).toBeFocused();
      await expect(rootError.getByText(/^Reference: [a-f0-9]{8}$/i)).toBeVisible();
      await expect(rootError.getByRole("button", { name: "Copy reference" })).toBeVisible();
      await rootError.getByRole("button", { name: "Copy reference" }).click({ force: true });
      await expect(rootError.getByRole("status")).toContainText("Reference copied.");
      const clipboard = await page.evaluate(() => navigator.clipboard.readText());
      expect(clipboard).toMatch(/^[a-f0-9]{8}$/i);
      await expect.poll(() => sanitizedReports.length).toBeGreaterThan(0);
      expect(sanitizedReports.every(report =>
        report.message === "A page could not be displayed." &&
        report.event === "render" &&
        !JSON.stringify(report).includes("SYNTHETIC_TEST_ERROR_DO_NOT_DISPLAY")
      )).toBe(true);
      expect(await page.evaluate(() =>
        document.documentElement.scrollWidth > window.innerWidth
      )).toBe(false);
    });

  test(`UX-G186 ${viewport.name} global CSS survives a missing app stylesheet`,
    async ({ page }) => {
      await page.setViewportSize(viewport);
      // This static preview tests the exact global-error CSS without claiming
      // to have forced the Next.js root layout itself to throw.
      await page.setContent(`<!doctype html>
        <html lang="en" data-lms-global-error="true">
        <head><meta name="viewport" content="width=device-width,initial-scale=1">
        <meta name="robots" content="noindex,nofollow">
        <title>Page unavailable · 42LMS</title><style>${fallbackCss}</style></head>
        <body><main data-root-error="true" role="alert"
          aria-labelledby="root-error-status" aria-describedby="root-error-guidance">
          <h1 id="root-error-status" tabindex="-1">500</h1>
          <h2>Server Error</h2>
          <p id="root-error-guidance">Something went wrong on our side. Please try again in a moment.</p>
          <div><a href="/">Go to Home</a> <button type="button">Try again</button></div>
        </main></body></html>`);
      const screen = page.locator('main[data-root-error="true"]');
      await expect(screen).toBeVisible();
      await expect(page).toHaveTitle("Page unavailable · 42LMS");
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex,nofollow");
      await expect(screen.getByRole("heading", { name: "Server Error" })).toBeVisible();
      await expect(screen.getByRole("link", { name: "Go to Home" })).toHaveAttribute("href", "/");
      const metrics = await screen.evaluate(el => {
        const style = getComputedStyle(el);
        const title = el.querySelector("h1");
        return { display: style.display, minHeight: style.minHeight,
          headingSize: title ? Number.parseFloat(getComputedStyle(title).fontSize) : 0,
        };
      });
      expect(metrics.display).toBe("flex");
      expect(metrics.headingSize).toBeGreaterThanOrEqual(60);
      expect(await page.evaluate(() =>
        document.documentElement.scrollWidth > window.innerWidth
      )).toBe(false);
      await screen.getByRole("button", { name: "Try again" }).focus();
      await expect(screen.getByRole("button", { name: "Try again" })).toBeFocused();
    });
}
