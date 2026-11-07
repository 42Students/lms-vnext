import { expect, test } from "@playwright/test";

// Invalid tokens are rejected before any database/provider lookup. This lets
// the public error/recovery path be exercised on disposable CI without secrets.
test.describe("UX-G045 college join invitation recovery", () => {
  for (const width of [375, 1280]) {
    test(`expired or invalid college link is usable at ${width}px`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/college-join/invalid-token");
      await expect(page.getByRole("heading", { name: "This link is no longer valid" })).toBeVisible();
      await expect(page.getByText("Ask the placement cell for a new one.", { exact: false })).toBeVisible();
      await expect(page.getByRole("button", { name: "Send me a code" })).toHaveCount(0);
      await expect(page.getByLabel("Work email")).toHaveCount(0);

      const signIn = page.getByRole("link", { name: "Sign in" });
      await expect(signIn).toBeVisible();
      const bounds = await signIn.boundingBox();
      expect(bounds?.height ?? 0).toBeGreaterThanOrEqual(44);
      expect(await page.evaluate(() => document.documentElement.scrollWidth))
        .toBeLessThanOrEqual(width + 1);
      await testInfo.attach(`college-join-invalid-${width}px`, {
        body: await page.screenshot({ animations: "disabled" }),
        contentType: "image/png",
      });
      await signIn.click();
      await expect(page).toHaveURL(/\/login(?:\?|$)/);
    });
  }
});
