import { expect, test, type Page } from "@playwright/test";

const viewports = [
  { name: "desktop", width: 1280, height: 800 },
  { name: "mobile", width: 390, height: 844 },
] as const;

async function noHorizontalOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
}

for (const viewport of viewports) {
  test(`TPO G110–G119 recovery UI is navigable at ${viewport.name} size`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.goto("/e2e/ux-g110-g119-recovery");
    await expect(page.getByRole("heading", { name: "TPO recovery UX acceptance" })).toBeVisible();
    const invalid = page.getByRole("region", { name: "Invalid report filter recovery" });
    await expect(invalid).toContainText("No report records were loaded");
    const clear = invalid.getByRole("link", { name: "Clear filters" });
    await expect(clear).toHaveAttribute("href", "/tpo/reports/after-college");
    await clear.focus();
    await expect(clear).toBeFocused();
    const joining = page.getByRole("region", { name: "Empty joining season" });
    await expect(joining).toContainText("No joining outcomes are inferred");
    await expect(joining.getByRole("link", { name: "Review placement seasons" }))
      .toHaveAttribute("href", "/tpo/settings/season");
    const team = page.getByRole("region", { name: "Invalid team sort recovery" });
    await expect(team).toContainText("No team records were loaded");
    const sort = team.getByRole("link", { name: "Clear sort" });
    await expect(sort).toHaveAttribute("href", "/tpo/settings/team");
    await sort.focus();
    await expect(sort).toBeFocused();
    const dates = page.getByRole("region", { name: "Unavailable blocked dates" });
    await expect(dates).toContainText("Existing dates may still be recorded");
    await expect(dates.getByRole("link", { name: "Try loading dates again" }))
      .toHaveAttribute("href", "/tpo/settings/blocked-dates");
    await noHorizontalOverflow(page);
    const screenshot = testInfo.outputPath(`${viewport.name}-tpo-recovery.png`);
    await page.screenshot({ path: screenshot, fullPage: true });
    await testInfo.attach(`${viewport.name}-tpo-recovery`,
      { path: screenshot, contentType: "image/png" });
  });
}
