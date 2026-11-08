import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

const examples = [
  ["Eligibility preview", "eligibility-preview.csv", "Skip reason"],
  ["Drive-day round", "drive-day.csv", "Checked in"],
  ["Recruiter contacts", "recruiters.csv", "Invite"],
  ["Student requests", "requests.csv", "Requested at (UTC)"],
  ["Round failure report", "round-failures.csv", "Failed decisions"],
  ["Unplaced learner report", "unplaced.csv", "Still in a drive"],
] as const;

for (const viewport of [
  { name: "desktop", width: 1280, height: 800 },
  { name: "mobile", width: 390, height: 844 },
]) {
  test("UX-G181 " + viewport.name + " safe TPO CSV downloads", async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto("/e2e/ux-g181-tpo-csv");
    await expect(page.getByRole("heading", { name: "TPO CSV export quality check" })).toBeVisible();
    await expect(page.getByText("No live college or student data.", { exact: false })).toBeVisible();
    for (const [title, file, header] of examples) {
      const card = page.getByRole("heading", { name: title }).locator("..");
      const link = card.getByRole("link", { name: "Download sample CSV" });
      await expect(link).toHaveAttribute("download", file);
      expect((await link.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
      const [download] = await Promise.all([page.waitForEvent("download"), link.click()]);
      expect(download.suggestedFilename()).toBe(file);
      const filepath = await download.path();
      expect(filepath).not.toBeNull();
      const contents = await readFile(filepath!, "utf8");
      expect(contents).toContain(header);
      expect(contents).toContain("'\u093E=FORMULA(1)");
      expect(contents.endsWith("\r\n")).toBe(true);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(viewport.width + 1);
    await page.screenshot({ path: testInfo.outputPath("ux-g181-" + viewport.name + ".png"), fullPage: true });
    expect(errors).toEqual([]);
  });
}
