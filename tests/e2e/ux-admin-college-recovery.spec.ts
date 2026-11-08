import { expect, test, type Page } from "@playwright/test";

const fixture = "/e2e/ux-admin-college-recovery";
const cases = [
  "g015-drives", "g015-hiring", "g016-job", "g016-joining",
  "g017-new", "g017-offers", "g018-screenings", "g018-shortlist",
  "g019-lookup", "g019-programs", "g020-at-risk", "g020-readiness",
  "g021-overview", "g021-resources", "g023-quizzes", "g023-recruiters",
  "g024-auth", "g024-students", "g029-announcements", "g029-attendance",
] as const;

async function checkNoOverflow(page: Page) {
  const width = await page.evaluate(() => ({
    document: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
  }));
  expect(width.document, `Document overflow: ${JSON.stringify(width)}`).toBeLessThanOrEqual(width.viewport + 1);
}

for (const viewport of [
  { label: "desktop", width: 1280, height: 800 },
  { label: "mobile", width: 390, height: 844 },
] as const) {
  test(`20 authentic error components retain navigation, retry and privacy on ${viewport.label}`, async ({ page }, info) => {
    test.setTimeout(180_000);
    const runtimeErrors: string[] = [];
    page.on("pageerror", error => runtimeErrors.push(error.message));
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.route("**/api/client-errors", route => route.fulfill({ status: 204, body: "" }));
    await page.goto(fixture);
    const preview = page.getByRole("region", { name: "Selected error recovery" });
    const chooser = page.getByLabel("Route to inspect");

    for (const routeId of cases) {
      await chooser.selectOption(routeId);
      const retry = preview.getByRole("button", { name: /^(Try again|Retry)$/i });
      await expect(retry).toBeVisible();
      const safeReturn = preview.getByRole("link").first();
      await expect(safeReturn).toBeVisible();
      const href = await safeReturn.getAttribute("href");
      expect(href, `${routeId}: recovery must target a relative route`).toMatch(/^\/(?!\/)/);
      await expect(preview).not.toContainText("SENSITIVE_RUNTIME_SECRET_DO_NOT_RENDER");
      await retry.click();
      await expect(page.getByTestId("recovery-count")).toHaveText("Retry count: 1");
      await retry.focus();
      await expect(retry).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(page.getByTestId("recovery-count")).toHaveText("Retry count: 2");
      await checkNoOverflow(page);
      await page.screenshot({
        path: info.outputPath(`${routeId}-${viewport.label}.png`),
        fullPage: true,
      });
    }
    expect(runtimeErrors).toEqual([]);
  });
}
