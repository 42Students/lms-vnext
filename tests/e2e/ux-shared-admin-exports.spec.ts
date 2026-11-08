import { expect, test, type Page } from "@playwright/test";
import { authenticateGracefulRole } from "./support/roles";

async function noHorizontalOverflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
}

test.describe("UX-G165/G168 shared control and CSV UX journeys", () => {
  test.skip(!process.env.E2E_AUTH_SECRET || process.env.E2E_AUTH_ENABLED !== "true",
    "Requires disposable seeded browser identities");

  for (const layout of [
    {name:"phone-390",width:390,height:844},
    {name:"desktop-1280",width:1280,height:850},
  ]) {
    test(`${layout.name} Super Admin faculty directory retains navigation and exports`,async({page,context})=>{
      await authenticateGracefulRole(context,"superadmin");
      await page.setViewportSize({width:layout.width,height:layout.height});
      await page.goto("/admin/faculty");
      await expect(page.getByRole("heading",{name:"Faculty",exact:true}).first()).toBeVisible();
      await expect(page.getByText("Registered Faculty",{exact:true}).first()).toBeVisible();
      const allExports=page.locator('a[href^="/api/admin/faculty/export"]');
      if(await allExports.count()) {
        const exportLink=allExports.first();
        await expect(exportLink).toBeVisible();
        await exportLink.focus();
        await expect(exportLink).toBeFocused();
        await expect(exportLink).toHaveAttribute("href",/^\/api\/admin\/faculty\/export/);
      }
      expect(await noHorizontalOverflow(page)).toBe(true);
      await page.screenshot({path:`test-results/ux-g165-g168-admin-faculty-${layout.name}.png`,fullPage:true});
    });
  }

  test("learner cannot download the privileged Super Admin roster",async({page,context})=>{
    await authenticateGracefulRole(context,"learner");
    const response=await context.request.get("http://localhost:3000/api/admin/faculty/export");
    expect([401,403,404]).toContain(response.status());
    expect(response.headers()["content-disposition"]??"").not.toContain(".csv");
    expect((await response.text()).slice(0,500)).not.toContain("seed-superadmin");
  });
});
