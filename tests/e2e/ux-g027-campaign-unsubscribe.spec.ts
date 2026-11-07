import { expect, test } from "@playwright/test";

test.describe("UX-G027 campaign opt-out", () => {
  test("GET is non-mutating and the decision screen works on desktop and phone", async ({ page }, testInfo) => {
    let postCount = 0;
    await page.route("**/api/public/campaign-unsubscribe", async route => {
      postCount++;
      await route.fulfill({ status: 503, contentType: "application/json", body: '{"error":"UNAVAILABLE"}' });
    });
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/campaign-unsubscribe/placeholder-token");
    await expect(page.getByRole("heading", { name: "Stop these emails?" })).toBeVisible();
    await expect(page.getByText("No preference was changed.", { exact: false })).toBeVisible();
    await expect(page.getByRole("button", { name: "Unsubscribe" })).toBeEnabled();
    expect(postCount).toBe(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath("desktop-token.png"), fullPage: true });

    await page.setViewportSize({ width: 375, height: 812 });
    await expect(page.getByRole("button", { name: "Unsubscribe" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(postCount).toBe(0);
    await page.screenshot({ path: testInfo.outputPath("mobile-token.png"), fullPage: true });
  });

  test("mobile error is retryable; confirmed view requires successful redirect", async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 375, height: 812 });
    let posts = 0;
    await page.route("**/api/public/campaign-unsubscribe", async route => {
      posts++;
      if (posts === 1) {
        await route.fulfill({ status: 503, contentType: "application/json", body: '{"error":"SUPPRESSIONS_NOT_READY"}' });
      } else {
        await route.fulfill({ status: 303, headers: { location: "/campaign-unsubscribe/confirmed?scope=placement-cell" } });
      }
    });
    await page.goto("/campaign-unsubscribe/placeholder-token");
    await page.getByRole("button", { name: "Unsubscribe" }).click();
    await expect(page.locator('[data-slot="inline-notice"][role="alert"]')).toContainText("That didn’t work. Please try again.");
    await expect(page.getByRole("button", { name: "Unsubscribe" })).toBeEnabled();
    expect(new URL(page.url()).pathname).toContain("/campaign-unsubscribe/placeholder-token");
    await page.screenshot({ path: testInfo.outputPath("mobile-retry.png"), fullPage: true });

    await page.getByRole("button", { name: "Unsubscribe" }).click();
    await expect(page).toHaveURL(/\/campaign-unsubscribe\/confirmed\?scope=placement-cell$/);
    await expect(page.getByRole("heading", { name: "You're unsubscribed" })).toBeVisible();
    await expect(page.getByRole("status")).toContainText("This placement cell will not email you again.");
    await expect(page.getByRole("link", { name: "Return home" })).toBeVisible();
    expect(posts).toBe(2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath("mobile-confirmed.png"), fullPage: true });
  });

  test("global confirmation retains the separate transactional-email caveat", async ({ page }) => {
    await page.goto("/campaign-unsubscribe/confirmed?scope=global");
    await expect(page.getByRole("heading", { name: "Email preference updated" })).toBeVisible();
    await expect(page.getByRole("status")).toContainText("Transactional account messages may use separate preferences.");
    await expect(page.getByRole("status")).not.toContainText("This placement cell will not email you again.");
    await expect(page.getByRole("link", { name: "Return home" })).toHaveAttribute("href", "/");
  });
});
