import { expect, test } from "@playwright/test";
import { authenticateGracefulRole } from "./support/roles";

const reports = [
  { path: "joining-followups", title: "Joining follow-ups" },
  { path: "joining-status", title: "Joining outcomes" },
  { path: "leads", title: "Recruiter engagement" },
  { path: "offers-acceptance", title: "Offers and acceptance" },
  { path: "offers-expiry", title: "Offer expiry watchlist" },
  { path: "placed-branch", title: "Placed students by branch" },
] as const;
const sizes = [
  { name: "desktop", width: 1280, height: 800 },
  { name: "mobile", width: 390, height: 844 },
] as const;

test.describe("UX-G114 six persisted TPO reports and invalid report bookmarks", () => {
  test.skip(process.env.UX_G114_REPORT_ACCEPTANCE !== "true", "Dedicated seeded report acceptance only");
  test.beforeAll(() => {
    if (process.env.E2E_AUTH_ENABLED !== "true" || !process.env.E2E_AUTH_SECRET || !process.env.E2E_DATABASE_URL) {
      throw new Error("Real disposable PostgreSQL with seeded authenticated TPO is mandatory");
    }
  });

  for (const size of sizes) {
    for (const report of reports) {
      test(`${size.name} real report ${report.path}: read, navigation and evidence bounds`, async ({ page, context }, info) => {
        test.setTimeout(120_000);
        await authenticateGracefulRole(context, "tpo");
        await page.setViewportSize(size);
        const destination = "/tpo/reports/" + report.path;
        const response = await page.goto(destination, {waitUntil:"domcontentloaded"});
        expect(response?.status()).toBe(200);
        expect(new URL(page.url()).pathname).toBe(destination);
        await expect(page.getByRole("heading", { name: report.title, level: 1 })).toBeVisible();
        await expect(page.locator("[data-tpo-presentation-report]")).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth-window.innerWidth)).toBeLessThanOrEqual(2);
        await page.screenshot({ path: info.outputPath(`g114-${report.path}-${size.name}-valid.png`),fullPage:true});
      });

      test(`${size.name} report ${report.path}: reject repeated season before data reads`,async({page,context},info)=>{
        test.setTimeout(120_000);
        await authenticateGracefulRole(context,"tpo");
        await page.setViewportSize(size);
        const destination="/tpo/reports/"+report.path;
        const response=await page.goto(destination+(report.path==="offers-expiry"?"?days=7&days=14":"?seasonId=first&seasonId=second"),{waitUntil:"domcontentloaded"});
        expect(response?.status()).toBe(200);
        await expect(page.getByRole("heading",{name:"Invalid report filters"})).toBeVisible();
        await expect(page.getByText("No report records were loaded",{exact:false})).toBeVisible();
        const clear=page.getByRole("link",{name:"Clear filters"});
        await expect(clear).toHaveAttribute("href",destination);
        await clear.focus();
        await expect(clear).toBeFocused();
        expect(await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth)).toBeLessThanOrEqual(2);
        await page.screenshot({path:info.outputPath(`g114-${report.path}-${size.name}-invalid.png`),fullPage:true});
      });
    }

    test(`${size.name} learner cannot read any six TPO report routes`,async({page,context},info)=>{
      test.setTimeout(120_000);
      await authenticateGracefulRole(context,"learner");
      await page.setViewportSize(size);
      for(const report of reports){
        await page.goto("/tpo/reports/"+report.path,{waitUntil:"domcontentloaded"});
        await expect(page).toHaveURL(/\/(?:dashboard(?:[?#]|$)|learn\/courses\?access=denied(?:&|$))/);
        await expect(page.locator("[data-tpo-presentation-report]")).toHaveCount(0);
      }
      await page.screenshot({path:info.outputPath(`g114-learner-denial-${size.name}.png`),fullPage:true});
    });
  }
});
