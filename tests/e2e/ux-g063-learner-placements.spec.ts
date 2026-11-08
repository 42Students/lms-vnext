import { expect, test } from "@playwright/test";

for (const viewport of [
  { name: "desktop", width: 1280, height: 800 },
  { name: "mobile", width: 390, height: 844 },
] as const) {
  test("UX-G063 " + viewport.name + " placement journey recovery", async ({ page }, info) => {
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto("/e2e/ux-g063-learner-placements");

    const detail = page.getByRole("region", { name: "Job detail recovery" });
    await expect(detail.getByText("Application status unavailable")).toBeVisible();
    await expect(detail.getByRole("link", { name: "Browse drives" }))
      .toHaveAttribute("href", "/learn/my-placements/jobs");
    await expect(detail.getByRole("link", { name: "My applications" }))
      .toHaveAttribute("href", "/learn/my-placements/applications");
    await detail.getByRole("button", { name: "Check status again" }).click();
    await expect(page.getByTestId("placement-retry-count")).toHaveText("Retry attempts: 1");

    const preference = page.getByRole("region", { name: "Notification preference recovery" });
    await expect(preference.getByRole("link", { name: "My Placements" }))
      .toHaveAttribute("href", "/learn/my-placements");
    await preference.getByRole("button", { name: "Retry" }).click();
    await expect(page.getByTestId("placement-retry-count")).toHaveText("Retry attempts: 2");

    await expect(page.getByRole("region", { name: "Offer recovery" })
      .getByText(/does not mean there are no offers/i)).toBeVisible();
    await expect(page.locator("main")).not.toContainText("PRIVATE_ERROR_DO_NOT_DISPLAY");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath("ux-g063-" + viewport.name + ".png"),
      fullPage: true });
    expect(errors).toEqual([]);
  });
}
