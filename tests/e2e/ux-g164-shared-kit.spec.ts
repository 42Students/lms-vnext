import { expect, test } from "@playwright/test";

for (const viewport of [
  { name: "desktop", width: 1280, height: 800 },
  { name: "mobile", width: 390, height: 844 },
] as const) {
  test("UX-G164 " + viewport.name + " shared kit accessibility and navigation", async ({ page }, info) => {
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto("/e2e/ux-shared-kit?page=2");
    await expect(page.getByRole("heading", { name: "Shared UX primitives" })).toBeVisible();
    const form = page.getByRole("region", { name: "UX-G164 form and notices" });
    const input = form.getByRole("textbox", { name: "Workspace label" });
    await form.getByRole("button", { name: "Validate" }).click();
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(form.getByText("Enter a workspace label.")).toBeVisible();
    await input.fill("Test workspace");
    await expect(input).not.toHaveAttribute("aria-invalid", "true");
    await form.getByRole("switch", { name: "Email updates" }).check();
    await expect(form.getByRole("switch", { name: "Email updates" })).toBeChecked();
    await expect(form.getByRole("status")).toHaveAttribute("aria-live", "polite");
    await form.getByRole("button", { name: "Dismiss notice" }).click();
    await expect(form.getByText("Notice dismissed")).toBeVisible();
    const loading = page.getByRole("region", { name: "UX-G164 loading regions" });
    await expect(loading.getByRole("status")).toHaveCount(2);
    await expect(loading.locator('[data-slot="skeleton"][aria-hidden="true"]')).toHaveCount(4);
    const pages = page.getByRole("navigation", { name: "Example results pages" });
    await expect(pages.getByText("Showing 7–12 of 27")).toBeVisible();
    await pages.getByRole("link", { name: "Next page" }).click();
    await expect(page).toHaveURL(/\/e2e\/ux-shared-kit\?page=3$/);
    await expect(page.getByRole("navigation", { name: "Example results pages" })
      .getByText("Showing 13–18 of 27")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath("ux-g164-" + viewport.name + ".png"), fullPage: true });
    expect(errors).toEqual([]);
  });
}
