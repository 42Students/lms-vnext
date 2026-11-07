import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

const files = [
  ["Department attendance", "department-attendance.csv", "Marked Sessions", "\u093E=SUM(1)"],
  ["Learner attendance", "learner-attendance.csv", "Starts UTC", "\u20DD@IMPORTDATA(1)"],
  ["College admin history", "college-admin-history.csv", "When (IST)", "\u20DD=FORMULA"],
  ["College readiness evidence", "college-readiness.csv", "Remediation", "\u093E=UNSAFE"],
  ["College directory", "tenant-directory.csv", "Created (IST)", "\u093E+FORMULA"],
] as const;

for (const viewport of [
  {name: "desktop", width: 1280, height: 800},
  {name: "mobile", width: 390, height: 844},
]) {
  test(`UX-G170/G172 ${viewport.name}: downloads readable, safe CSV from real serializers`,
    async ({page}, testInfo) => {
      await page.setViewportSize(viewport);
      const pageErrors: string[] = [];
      page.on("pageerror", error => pageErrors.push(error.message));
      await page.goto("/e2e/ux-g170-g172-csv");
      await expect(page.getByRole("heading", {name: "Export quality check"})).toBeVisible();
      await expect(page.getByText("No live account or college data.", {exact: false})).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth))
        .toBeLessThanOrEqual(viewport.width + 1);
      for (const [label, fileName, header, unsafeValue] of files) {
        const card = page.getByRole("heading", {name: label}).locator("..");
        const action = card.getByRole("link", {name: "Download sample CSV"});
        await expect(action).toHaveAttribute("download", fileName);
        expect((await action.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
        const [download] = await Promise.all([
          page.waitForEvent("download"), action.click(),
        ]);
        expect(download.suggestedFilename()).toBe(fileName);
        const file = await download.path();
        expect(file).not.toBeNull();
        const content = await readFile(file!, "utf8");
        expect(content.startsWith("\uFEFF")).toBe(true);
        expect(content).toContain(header);
        expect(content).toContain("'" + unsafeValue);
      }
      await page.screenshot({
        path: testInfo.outputPath("ux-g170-g172-" + viewport.name + ".png"),
        fullPage: true,
      });
      expect(pageErrors).toEqual([]);
    });
}
