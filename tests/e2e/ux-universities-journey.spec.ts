import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";

/** UX-G123: public desktop/mobile acceptance, no test account or private data. */
for (const viewport of [
  { name: "desktop", width: 1280, height: 800 },
  { name: "mobile", width: 390, height: 844 },
] as const) {
  test(`UX-G123 ${viewport.name}: universities page is navigable and responsive`,
    async ({ page }, testInfo) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      const failures: string[] = [];
      page.on("pageerror", error => failures.push(error.message));
      await page.goto("/universities");
      await expect(page.getByRole("heading", { level: 1,
        name: "Develop employable graduates through learning and placements" })).toBeVisible();
      const shortcuts = page.getByRole("navigation", { name: "Explore university solutions" });
      const demo = shortcuts.getByRole("link", { name: "Request a Demo" });
      await expect(demo).toHaveAttribute("href", "/request-demo");
      await demo.focus();
      await expect(demo).toBeFocused();
      const capabilities = shortcuts.getByRole("link", { name: "Campus capabilities" });
      await expect(capabilities).toHaveAttribute("href", "#university-capabilities");
      await capabilities.click();
      await expect(page).toHaveURL(/#university-capabilities$/);
      await expect(page.getByRole("heading", { name: "For the entire campus" })).toBeVisible();
      const journey = shortcuts.getByRole("link", { name: "Student journey" });
      await journey.click();
      await expect(page).toHaveURL(/#university-journey$/);
      await expect(page.getByRole("heading", { name: "From classroom to career" })).toBeVisible();
      await expect(page.getByRole("listitem").filter({ hasText: "Mentored projects and milestones" })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
      expect(failures).toEqual([]);
      // Write outside Playwright's cleaned outputDir so CI can always retain evidence.
      await mkdir("ux-g123-evidence", { recursive: true });
      const screenshot = await page.screenshot({
        path: `ux-g123-evidence/${viewport.name}.png`, fullPage: true,
      });
      await testInfo.attach(`UX-G123-${viewport.name}.png`, {
        body: screenshot, contentType: "image/png",
      });
    });
}
