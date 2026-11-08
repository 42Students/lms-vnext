import { expect, test, type BrowserContext } from "@playwright/test";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { authenticateGracefulRole } from "./support/roles";

async function signInForActivityExport(context:BrowserContext,email:"superadmin.seed@example.com"|"collegeadmin.seed@example.com",role?:"COLLEGE_ADMIN"){
  const origin="http://localhost:3000";
  const code=process.env.AUTH_TEST_OTP;
  expect(code,"disposable database OTP fixture").toMatch(/^\d{6}$/);
  await context.clearCookies();
  const start=await context.request.post(origin+"/api/auth/login/start",{
    headers:{origin},data:{channel:"EMAIL",contact:email},
  });
  expect(start.status(),"seeded OTP challenge must be issued").toBe(200);
  const challenge=await start.json() as {attemptId:string;requiresSecondFactor:boolean};
  expect(challenge.requiresSecondFactor).toBe(email==="superadmin.seed@example.com");
  const verify=await context.request.post(origin+"/api/auth/login/verify",{
    headers:{origin},data:{attemptId:challenge.attemptId,code,
      ...(challenge.requiresSecondFactor?{secondCode:code}:{})},
  });
  expect(verify.status(),"real device-bound OTP login").toBe(200);
  expect((await context.cookies(origin)).some(c=>c.name==="lms_session")).toBe(true);
  if(role){
    const selected=await context.request.post(origin+"/api/auth/memberships",{
      headers:{origin},data:{membershipId:SEED_IDS.collegeAdminMembership,role},
    });
    expect(selected.status(),"persisted College Admin grant").toBe(200);
  }
}

test.describe("UX-G167 Activity CSV exports: authorized desktop/mobile downloads", () => {
  test.skip(!process.env.E2E_AUTH_SECRET || process.env.E2E_AUTH_ENABLED !== "true",
    "Requires isolated seeded authenticated browser test database");

  test("super-admin desktop sees all-matching export with safe response headers", async ({page, context}) => {
    await signInForActivityExport(context, "superadmin.seed@example.com");
    await page.setViewportSize({width:1280,height:800});
    await page.goto("/activity?view=all&range=ALL");
    await expect(page.getByRole("heading", {name:"Activity Log",level:1})).toBeVisible();
    const link=page.getByRole("link",{name:"Export all matching CSV"});
    // A freshly seeded activity log may legitimately have zero matching rows.
    const href=await link.count()?await link.getAttribute("href"):"/api/activity/admin-export";
    if(await link.count())await expect(link).toBeVisible();
    else await expect(page.getByText("Export unavailable (no matching activity)")).toBeVisible();
    expect(href).toContain("/api/activity/admin-export");
    const response=await page.request.get(href!);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("text/csv");
    expect(response.headers()["cache-control"]).toContain("no-store");
    expect(response.headers()["content-disposition"]).toContain("attachment");
    expect(response.headers()["x-export-row-cap"]).toBe("1000");
    const csv=await response.text();
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain('"Time","Who","What","Item","Action key","IP"');
    await page.screenshot({path:"test-results/ux-g167-admin-desktop.png",fullPage:true});
  });

  test("college-admin mobile exports only scoped activity and learner is denied", async ({page,context}) => {
    await signInForActivityExport(context, "collegeadmin.seed@example.com", "COLLEGE_ADMIN");
    await page.setViewportSize({width:390,height:844});
    await page.goto("/activity?view=all&range=ALL");
    await expect(page.getByRole("heading", {name:"Activity Log",level:1})).toBeVisible();
    const link=page.getByRole("link",{name:"Export all matching CSV"});
    // A freshly seeded activity log may legitimately have zero matching rows.
    const href=await link.count()?await link.getAttribute("href"):"/api/activity/college-export";
    if(await link.count())await expect(link).toBeVisible();
    else await expect(page.getByText("Export unavailable (no matching activity)")).toBeVisible();
    expect(href).toContain("/api/activity/college-export");
    const response=await page.request.get(href!);
    expect(response.status()).toBe(200);
    expect(response.headers()["cache-control"]).toContain("no-store");
    expect(response.headers()["x-export-row-cap"]).toBe("1000");
    const csv=await response.text();
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain('"Time","Who","What","Item","Action key","IP"');
    expect(csv).not.toContain('"127.0.0.1"');
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
    await page.screenshot({path:"test-results/ux-g167-college-mobile.png",fullPage:true});

    await authenticateGracefulRole(context, "learner");
    const denied=await page.request.get("/api/activity/college-export");
    expect(denied.ok()).toBe(false);
  });
});
