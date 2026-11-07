import {expect,test,type BrowserContext} from "@playwright/test";
import {writeFileSync} from "node:fs";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {authenticateGracefulRole} from "./support/roles";

// This suite uses the real OTP/device-session flow against the disposable E2E DB.
// Sensitive CSV APIs must not accept E2E identity cookies as a fresh login.
async function login(context:BrowserContext,contact:string,role?:"COLLEGE_ADMIN"){
  const origin="http://localhost:3000";
  const code=process.env.AUTH_TEST_OTP;
  expect(code).toMatch(/^\d{6}$/);
  await context.clearCookies();
  const started=await context.request.post(origin+"/api/auth/login/start",{
    headers:{origin},data:{channel:"EMAIL",contact},
  });
  expect(started.status(),"OTP challenge").toBe(200);
  const attempt=await started.json() as {attemptId:string;requiresSecondFactor:boolean};
  const verified=await context.request.post(origin+"/api/auth/login/verify",{
    headers:{origin},data:{attemptId:attempt.attemptId,code,
      ...(attempt.requiresSecondFactor?{secondCode:code}:{})},
  });
  expect(verified.status(),"device-bound sign-in").toBe(200);
  if(role){
    const selected=await context.request.post(origin+"/api/auth/memberships",{
      headers:{origin},data:{membershipId:SEED_IDS.collegeAdminMembership,role},
    });
    expect(selected.status(),"persisted college role selection").toBe(200);
  }
  expect((await context.cookies(origin)).some(c=>c.name==="lms_session")).toBe(true);
}

test.describe("UX-G170/G172 real role and tenant export boundaries",()=>{
  test.skip(!process.env.AUTH_TEST_OTP,"Requires seeded disposable PostgreSQL and development OTP");

  test("College Admin can export own departments but not a forged college scope or platform tenants",
    async({page,context})=>{
      await page.setViewportSize({width:390,height:844});
      await login(context,"collegeadmin.seed@example.com","COLLEGE_ADMIN");
      const own=await page.request.get("/api/attendance/admin/departments/export");
      expect(own.status()).toBe(200);
      expect(own.headers()["content-type"]).toContain("text/csv");
      const csv=await own.text();
      expect(csv.startsWith("\uFEFF")).toBe(true);
      expect(csv).toContain('"Department"');
      expect(csv).not.toMatch(/email|phoneE164|membershipId/i);
      writeFileSync("test-results/ux-g170-authorized-departments.csv",csv,"utf8");
      const forged=await page.request.get(
        "/api/attendance/admin/departments/export?collegeId="+SEED_IDS.collegeB);
      expect(forged.status()).toBeGreaterThanOrEqual(400);
      expect(forged.headers()["content-type"]??"").not.toContain("text/csv");
      const privileged=await page.request.get("/api/admin/tenants/export");
      expect([401,403]).toContain(privileged.status());
    });

  test("Super Admin fresh two-factor session downloads actual private tenant directory",
    async({page,context})=>{
      await page.setViewportSize({width:1280,height:800});
      await login(context,"superadmin.seed@example.com");
      const result=await page.request.get("/api/admin/tenants/export");
      expect(result.status()).toBe(200);
      expect(result.headers()["content-type"]).toContain("text/csv");
      expect(result.headers()["cache-control"]).toContain("no-store");
      expect(result.headers()["x-content-type-options"]).toBe("nosniff");
      const csv=await result.text();
      expect(csv.startsWith("\uFEFF")).toBe(true);
      expect(csv).toContain('"College Name"');
      expect(csv).toContain(SEED_IDS.collegeA);
      writeFileSync("test-results/ux-g172-authorized-tenants.csv",csv,"utf8");
    });

  test("Learner is denied both scoped department and platform tenant CSV exports",
    async({page,context})=>{
      await authenticateGracefulRole(context,"learner");
      for(const url of ["/api/attendance/admin/departments/export",
        "/api/admin/tenants/export"]){
        const result=await page.request.get(url);
        expect([401,403]).toContain(result.status());
        expect(result.headers()["content-type"]??"").not.toContain("text/csv");
      }
    });
});
