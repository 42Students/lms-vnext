import { expect, test } from "@playwright/test";

const fixture = "/e2e/ux-g141-g155-study-shell";

for (const viewport of [
  { name: "mobile", width: 390, height: 844 },
  { name: "desktop", width: 1280, height: 800 },
] as const) {
  test.describe("UX-G141/G155/G175 " + viewport.name, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.route(/\/api\/notifications\?/, route => route.fulfill({
        status: 200, contentType: "application/json",
        body: JSON.stringify({ notifications: [] }),
      }));
    });

    test("group creation and membership errors stay in their confirmation dialogs", async ({ page }, testInfo) => {
      let creates = 0;
      await page.route(/\/api\/college\/groups$/, async route => {
        creates += 1;
        await route.fulfill({
          status: creates === 1 ? 409 : 201,
          contentType: "application/json",
          body: JSON.stringify(creates === 1 ? { error: "GROUP_CONFLICT" } : { id: "new-group" }),
        });
      });
      await page.route(/\/api\/college\/groups\/[^/]+\/members$/, route => route.fulfill({
        status: 409, contentType: "application/json", body: '{"error":"Action rejected"}',
      }));
      await page.goto(fixture);
      await expect(page.getByRole("heading", { name: "Study group and shell UX acceptance" })).toBeVisible();
      await page.getByRole("region", { name: "Group creation fixture" })
        .getByRole("button", { name: "New study group" }).click();
      const editor = page.getByRole("dialog", { name: "New study group" });
      await editor.getByRole("textbox", { name: "Group name" }).fill("Study Group Beta");
      await editor.getByRole("button", { name: "Save group" }).click();
      await expect(editor.getByRole("alert")).toBeVisible();
      await expect(editor).toBeVisible();
      await editor.getByRole("button", { name: "Save group" }).click();
      await expect(editor).toBeHidden();
      expect(creates).toBe(2);

      await page.getByRole("region", { name: "Member actions fixture" })
        .getByRole("button", { name: "Lock", exact: true }).click();
      const review = page.getByRole("alertdialog");
      await expect(review).toBeVisible();
      await review.getByRole("button", { name: "Confirm" }).click();
      await expect(review.getByText("Action rejected")).toBeVisible();
      await review.getByRole("button", { name: "Cancel" }).click();
      await expect(review).toBeHidden();
      await page.screenshot({ path: testInfo.outputPath("group-actions-" + viewport.name + ".png"), fullPage: true });
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width + 1);
    });

    test("CSV validation remains readable and rejected replacement clears stale approval", async ({ page }, testInfo) => {
      await page.route("**/api/college/groups/import-preview", route => route.fulfill({
        status: 200, contentType: "application/json",
        body: JSON.stringify({
          groupId: "10000000-0000-4000-8000-000000000001", status: "ACTIVE",
          total: 2, ready: 1, blocked: 1,
          warning: "Dry run only; capacity is rechecked before writing.",
          errorCsv: "Row,Email,Validation",
          rows: [
            { rowNumber: 2, email: "ready@example.com", status: "READY" },
            { rowNumber: 3, email: "invalid", status: "INVALID_EMAIL" },
          ],
        }),
      }));
      await page.goto(fixture);
      const section = page.getByRole("region", { name: "Group import fixture" });
      const file = section.getByLabel("Select CSV file");
      await file.setInputFiles({
        name: "members.csv", mimeType: "text/csv",
        buffer: Buffer.from("email\nready@example.com\ninvalid\n"),
      });
      await section.getByRole("button", { name: "Preview members" }).click();
      await expect(section.getByRole("heading", { name: /Dry run: 1 ready, 1 blocked/ })).toBeVisible();
      await expect(section.getByText("Invalid email address")).toBeVisible();
      await expect(section.getByRole("button", { name: /Confirm import of 1 eligible learner/ })).toBeEnabled();

      await file.setInputFiles({
        name: "oversized.csv", mimeType: "text/csv", buffer: Buffer.alloc(524289, 65),
      });
      await expect(section.getByText("This file is larger than the allowed limit.")).toBeVisible();
      await expect(section.getByRole("heading", { name: /Dry run:/ })).toHaveCount(0);
      await expect(section.getByRole("button", { name: "Preview members" })).toBeDisabled();
      await page.screenshot({ path: testInfo.outputPath("csv-reset-" + viewport.name + ".png"), fullPage: true });
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width + 1);
    });

    test("learner bell recovers from failed deadlines and mobile menu restores focus", async ({ page }, testInfo) => {
      await page.route("**/api/courses/learner/due-notices", route => route.fulfill({
        status: 503, contentType: "application/json", body: '{"error":"Unavailable"}',
      }));
      await page.goto(fixture);
      const bell = page.getByRole("button", { name: /Notifications, no unread in recent items/ });
      await bell.click();
      const panel = page.getByRole("dialog", { name: "Notifications" });
      await expect(panel).toBeVisible();
      await expect(panel.getByText(/Course deadlines could not be refreshed/)).toBeVisible();
      await expect(panel.getByRole("link", { name: "See all notifications" })).toHaveAttribute("href", "/learn/notifications");
      await page.screenshot({ path: testInfo.outputPath("bell-" + viewport.name + ".png"), fullPage: true });
      await page.keyboard.press("Escape");
      await expect(panel).toBeHidden();

      if (viewport.name === "mobile") {
        const menu = page.getByRole("button", { name: "Open menu" });
        await menu.click();
        const drawer = page.getByRole("dialog", { name: "Navigation menu" });
        await expect(drawer).toBeVisible();
        await expect(drawer.getByRole("link", { name: "Courses" })).toHaveAttribute("href", "/learn/courses");
        await page.keyboard.press("Escape");
        await expect(drawer).toBeHidden();
        await expect(menu).toBeFocused();
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width + 1);
    });
  });
}
