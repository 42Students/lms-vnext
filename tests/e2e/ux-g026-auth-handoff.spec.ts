import { expect, test } from "@playwright/test";

test.describe("UX-G026 retired authentication handoff", () => {
  test("desktop hostile handoff drops old credentials and opens a clear fresh-sign-in message", async ({ page }, info) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/auth/handoff?token=private-credential&next=https%3A%2F%2Fattacker.example%2Fadmin");
    await expect(page).toHaveURL(/\/login\?auth=handoff-retired$/);
    const location = new URL(page.url());
    expect(location.origin).toBe("http://localhost:3000");
    expect(location.searchParams.has("token")).toBe(false);
    expect(location.searchParams.has("next")).toBe(false);
    expect(location.searchParams.has("returnTo")).toBe(false);
    await expect(page.getByText("This old sign-in link has changed")).toBeVisible();
    await expect(page.getByRole("link", { name: "Start a fresh sign-in" })).toBeVisible();
    await expect(page.locator("body")).not.toContainText("private-credential");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath("handoff-desktop-rejected.png"), fullPage: true });
  });

  test("mobile preserves only safe return options, never forwarded bearer query fields", async ({ page }, info) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const original = "/learn/courses?tab=all&view=cards&code=secret&access_token=private#sensitive";
    await page.goto("/auth/handoff?token=private-credential&returnTo=" + encodeURIComponent(original));
    await expect(page).toHaveURL(/\/login\?auth=handoff-retired/);
    const url = new URL(page.url());
    expect(url.searchParams.get("auth")).toBe("handoff-retired");
    expect(url.searchParams.get("returnTo")).toBe("/learn/courses?tab=all&view=cards");
    expect(url.href).not.toContain("private-credential");
    expect(url.href).not.toContain("secret");
    expect(url.href).not.toContain("sensitive");
    await expect(page.getByText("This old sign-in link has changed")).toBeVisible();
    await expect(page.getByRole("link", { name: "Start a fresh sign-in" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath("handoff-mobile-safe-return.png"), fullPage: true });
  });
});
