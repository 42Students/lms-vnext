import { expect, test, type Page, type BrowserContext } from "@playwright/test";
import { authenticateGracefulRole } from "./support/roles";

async function noHorizontalOverflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
}

/** Fresh first-party OTP login is required by sensitive roster CSV endpoints.
 * This test does not create a synthetic production session or bypass step-up.
 */
async function realSuperAdminSignIn(context:BrowserContext){
  const origin="http://localhost:3000";
  const code=process.env.AUTH_TEST_OTP;
  expect(code,"development-only seeded OTP fixture").toMatch(/^\\d{6}$/);
  await context.clearCookies();
  const started=await context.request.post(origin+"/api/auth/login/start",{
    headers:{origin},data:{channel:"EMAIL",contact:"superadmin.seed@example.com"},
  });
  expect(started.status()).toBe(200);
  const attempt=await started.json() as {attemptId:string;requiresSecondFactor:boolean};
  expect(attempt.requiresSecondFactor).toBe(true);
  const verified=await context.request.post(origin+"/api/auth/login/verify",{
    headers:{origin},data:{attemptId:attempt.attemptId,code,secondCode:code},
  });
  expect(verified.status(),"fresh two-factor device sign-in").toBe(200);
  expect((await context.cookies(origin)).some(c=>c.name==="lms_session")).toBe(true);
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

  test("fresh Super Admin two-factor session downloads bounded and private faculty CSV",async({page,context})=>{
    await realSuperAdminSignIn(context);
    await page.setViewportSize({width:1280,height:850});
    const result=await page.request.get("/api/admin/faculty/export");
    expect(result.status(),"authorized roster CSV must download").toBe(200);
    expect(result.headers()["content-type"]).toContain("text/csv");
    expect(result.headers()["content-disposition"]).toContain("attachment;");
    expect(result.headers()["cache-control"]).toContain("private");
    expect(result.headers()["cache-control"]).toContain("no-store");
    expect(result.headers()["x-content-type-options"]).toBe("nosniff");
    expect(result.headers()["x-export-row-cap"]).toBe("250");
    const csv=await result.text();
    expect(csv.startsWith("\\uFEFF")).toBe(true);
    expect(csv).toContain('"Record ID","Name","Context","Status","Additional persisted fields"');
    expect(csv).not.toMatch(/password|otp|auth_secret|phoneE164/i);
    const badQuery=await page.request.get("/api/admin/faculty/export?page=2");
    expect(badQuery.status(),"client paging must not change bounded export").toBeGreaterThanOrEqual(400);
    expect(badQuery.headers()["content-type"]??"").not.toContain("text/csv");
  });

  test("learner cannot download the privileged Super Admin roster",async({page,context})=>{
    await authenticateGracefulRole(context,"learner");
    const response=await context.request.get("http://localhost:3000/api/admin/faculty/export");
    expect([401,403,404]).toContain(response.status());
    expect(response.headers()["content-disposition"]??"").not.toContain(".csv");
    expect((await response.text()).slice(0,500)).not.toContain("seed-superadmin");
  });
});
