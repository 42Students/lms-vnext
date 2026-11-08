import { expect, test } from "@playwright/test";

for (const viewport of [
  { name: "desktop", width: 1280, height: 800 },
  { name: "mobile", width: 390, height: 844 },
] as const) {
  test("G176 " + viewport.name + ": provider-facing alert and acknowledgement stay readable and private",
    async ({ page }, info) => {
      await page.setViewportSize(viewport);
      const browserErrors: string[] = [];
      page.on("pageerror", error => browserErrors.push(error.message));
      await page.goto("/e2e/ux-g176-telegram-preview");
      await expect(page.getByRole("heading", { name: "Telegram alert preview" })).toBeVisible();
      const delivered = page.getByRole("region", { name: "Simulated Telegram delivery" });
      await expect(delivered.getByRole("status")).toHaveText("Provider accepted simulated alert");
      const body = page.getByTestId("telegram-alert-body");
      await expect(body).toContainText("Request ID: 1234abcd");
      await expect(body).toContainText("Time: 2026-11-08T00:00:00.000Z");
      await expect(body).toContainText("Deploy: a1b2c3d4");
      await expect(body).not.toContainText("person@example.com");
      await expect(body).not.toContainText("synthetic-only-token");
      const acknowledged = page.getByTestId("telegram-ack-body");
      await expect(acknowledged).toContainText("Request ID: 1234abcd");
      await expect(acknowledged).not.toContainText("person@example.com");
      await expect(acknowledged).toContainText("✅ Acknowledged");
      expect((await acknowledged.textContent() ?? "").match(/✅ Acknowledged/g)?.length).toBe(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: info.outputPath("G176-" + viewport.name + ".png"), fullPage: true });
      expect(browserErrors).toEqual([]);
    });
}
