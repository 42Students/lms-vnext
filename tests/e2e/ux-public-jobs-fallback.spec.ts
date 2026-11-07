import { expect, test } from "@playwright/test";

test.describe("UX-G058/G187/G188 public journeys", () => {
  for (const width of [390, 1280]) {
    test("external job stays readable and opens verified employer in a new tab at " + width + "px",
      async ({ page }, testInfo) => {
        await page.setViewportSize({ width, height: 800 });
        await page.goto("/e2e/ux-g058-external-job");
        await expect(page.getByRole("heading", { name: "Junior Data Analyst" })).toBeVisible();
        await expect(page.getByRole("heading", { name: "About this role" })).toBeVisible();
        await expect(page.getByText("Example Employer")).toBeVisible();
        await expect(page.getByText("Work mode: ON SITE")).toBeVisible();
        await expect(page.getByText("42 LMS does not receive or confirm", { exact: false })).toBeVisible();
        const action = page.getByRole("link", { name: /Continue to employer website/ });
        await expect(action).toHaveAttribute("href", "https://careers.example.test/jobs/data-analyst");
        await expect(action).toHaveAttribute("target", "_blank");
        await expect(action).toHaveAttribute("rel", "noopener noreferrer");
        expect((await action.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 1);
        await page.screenshot({ path: testInfo.outputPath("external-job-" + width + ".png"), fullPage: true });
        await page.context().route("https://careers.example.test/**", route =>
          route.fulfill({ status: 200, contentType: "text/html", body: "<h1>Employer application</h1>" }));
        const [popup] = await Promise.all([page.context().waitForEvent("page"), action.click()]);
        await expect(popup.getByRole("heading", { name: "Employer application" })).toBeVisible();
        expect(page.url()).toContain("/e2e/ux-g058-external-job");
        await popup.close();
      });

    test("invalid bearer link returns safe 404 and anonymous sign-in recovery at " + width + "px",
      async ({ page }, testInfo) => {
        await page.setViewportSize({ width, height: 800 });
        // Next.js streams not-found UI with HTTP 200 in development; the UX
        // gate checks the actual denial page and absence of employer data.
        await page.goto("/jobs/external/not-a-public-slug");
        await expect(page.getByRole("heading", { name: "Page Not Found" })).toBeVisible();
        await expect(page.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login");
        await expect(page.getByRole("link", { name: "Go to Home" })).toHaveAttribute("href", "/dashboard");
        await expect(page.getByRole("button", { name: "Go back" })).toBeVisible();
        await expect(page.getByText("Example Employer")).toHaveCount(0);
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 1);
        await page.screenshot({ path: testInfo.outputPath("not-found-" + width + ".png"), fullPage: true });
      });

    test("root loading announces progress and offers bounded retry at " + width + "px",
      async ({ page }, testInfo) => {
        await page.setViewportSize({ width, height: 800 });
        await page.goto("/e2e/ux-g187-loading");
        await expect(page.getByRole("heading", { name: "Loading 42 LMS..." })).toBeVisible();
        await expect(page.getByRole("status", { name: "Loading 42 LMS..." })).toBeVisible();
        await expect(page.getByRole("button", { name: "Try again" })).toHaveCount(0);
        // Exercise the real 12s effect rather than advancing a fake clock
        // ahead of React hydration / the effect registration.
        await expect(page.getByText("This is taking longer than expected.")).toBeVisible({ timeout: 20_000 });
        await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 1);
        await page.screenshot({ path: testInfo.outputPath("root-loading-" + width + ".png"), fullPage: true });
      });
  }
});
