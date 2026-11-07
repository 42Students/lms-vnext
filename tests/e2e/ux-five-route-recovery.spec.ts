import { expect, test } from "@playwright/test";

/**
 * Synthetic, development-only browser checks of the actual route recovery
 * components. No fake login, private DB data, or authorization bypass.
 * Authenticated role/tenant journeys remain separate closure gates.
 */
for (const viewport of [
  { label: "mobile", width: 390, height: 844 },
  { label: "desktop", width: 1280, height: 800 },
] as const) {
  test("legacy Admin retry and safe destination controls at " + viewport.label, async ({ page }, info) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    const errors: string[] = [];
    page.on("pageerror", err => errors.push(err.message));
    await page.goto("/e2e/ux-five-route-recovery");
    await expect(page.getByRole("heading", { name: "Five-group route recovery acceptance" })).toBeVisible();

    const departments = page.getByRole("region", { name: "College Admin department recovery" });
    await expect(departments.getByRole("link", { name: "Open departments" }))
      .toHaveAttribute("href", "/college/departments");
    await departments.getByRole("button", { name: "Retry" }).click();
    await expect(departments.getByRole("status")).toContainText("Department retry count: 1");
    const programs = page.getByRole("region", { name: "College Admin program recovery" });
    await expect(programs.getByRole("link", { name: "Open programs" }))
      .toHaveAttribute("href", "/college/programs");
    await programs.getByRole("button", { name: "Retry" }).click();
    await expect(programs.getByRole("status")).toContainText("Program retry count: 1");

    for (const button of [
      departments.getByRole("button", { name: "Retry" }),
      programs.getByRole("button", { name: "Retry" }),
    ]) {
      expect((await button.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
      await button.focus();
      await expect(button).toBeFocused();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(viewport.width + 1);
    await page.screenshot({ path: info.outputPath("admin-recovery-" + viewport.label + ".png"), fullPage: true });
    expect(errors).toEqual([]);
  });

  test("Super Admin and Faculty invalid routes recover safely at " + viewport.label, async ({ page }, info) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    const errors: string[] = [];
    page.on("pageerror", err => errors.push(err.message));
    await page.goto("/e2e/ux-five-route-recovery");
    const missing = page.getByRole("region", { name: "Super Admin missing legacy page" });
    await expect(missing.getByRole("heading", { name: "Page not found" })).toBeVisible();
    await expect(missing.getByRole("link", { name: "Back to dashboard" }))
      .toHaveAttribute("href", "/dashboard");

    const content = page.getByRole("region", { name: "Super Admin content invalid filter" });
    await expect(content.getByText("Invalid content filters")).toBeVisible();
    await expect(content.getByRole("link", { name: "Clear filters" }))
      .toHaveAttribute("href", "/admin/videos");

    const attempts = page.getByRole("region", { name: "Faculty attempt invalid filter" });
    await expect(attempts.getByText("Invalid quiz attempt filters")).toBeVisible();
    await expect(attempts.getByText(/No learner attempt details were loaded/)).toBeVisible();
    await expect(attempts.getByRole("link", { name: "Choose a Quiz again" }))
      .toHaveAttribute("href", "/teacher/allQuizzes");
    expect(await page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(viewport.width + 1);
    await page.screenshot({ path: info.outputPath("filtered-recovery-" + viewport.label + ".png"), fullPage: true });
    expect(errors).toEqual([]);
  });
}
