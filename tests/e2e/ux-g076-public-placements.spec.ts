import { expect, test } from "@playwright/test";

/** No auth or private placement records: published-college fixtures are a separate acceptance gate. */
for (const viewport of [
  { name: "desktop", width: 1280, height: 800 },
  { name: "mobile", width: 390, height: 844 },
] as const) {
  test("UX-G076 "+viewport.name+": retired job link is private and usable", async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    const failures: string[] = [];
    page.on("pageerror", error => failures.push(error.message));
    await page.goto("/placements/jobs/retired-job-link");
    await expect(page.getByRole("heading", { level: 1, name: "This shared job link is no longer public" })).toBeVisible();
    const main = page.getByTestId("placements.retired-job-link");
    await expect(main).toContainText("Historical links do not grant access");
    const signIn = main.getByRole("link", { name: "Sign in to browse college drives" });
    await expect(signIn).toHaveAttribute("href", "/login?next=%2Flearn%2Fmy-placements%2Fjobs");
    await expect(main.getByRole("link", { name: "Public placement information" })).toHaveAttribute("href", "/placements");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/i);
    await signIn.focus();
    await expect(signIn).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
    expect(failures).toEqual([]);
  });
  test("UX-G076 "+viewport.name+": platform host cannot impersonate a published college", async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    const response = await page.goto("/placements");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1, name: "This page isn't available" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Go to home" })).toHaveAttribute("href", "/");
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
  });
}
