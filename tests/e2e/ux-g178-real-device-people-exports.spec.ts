import { readFile } from "node:fs/promises";
import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { authenticateGracefulRole } from "./support/roles";
import { SEED_IDS } from "../../scripts/db-seed-data";

const origin="http://localhost:3000";
const enabled=process.env.APP_ENV==="development" &&
  process.env.E2E_AUTH_ENABLED==="true" && Boolean(process.env.AUTH_TEST_OTP);

async function signInWithRealOtp(context:BrowserContext,
  email:"collegeadmin.seed@example.com"|"superadmin.seed@example.com",
  role?:"COLLEGE_ADMIN") {
  const code=process.env.AUTH_TEST_OTP;
  expect(code).toMatch(/^\d{6}$/);
  await context.clearCookies();
  const started=await context.request.post(origin+"/api/auth/login/start",{
    headers:{origin},data:{channel:"EMAIL",contact:email},
  });
  expect(started.status(),"The real OTP challenge must be issued").toBe(200);
  const attempt=await started.json() as {attemptId:string;requiresSecondFactor:boolean};
  expect(attempt.requiresSecondFactor).toBe(email==="superadmin.seed@example.com");
  const verified=await context.request.post(origin+"/api/auth/login/verify",{
    headers:{origin},data:{attemptId:attempt.attemptId,code,
      ...(attempt.requiresSecondFactor?{secondCode:code}:{})},
  });
  expect(verified.status(),"The challenge must issue a real fresh device session").toBe(200);
  expect((await context.cookies(origin)).some(c=>c.name==="lms_session")).toBe(true);
  if(role){
    const selection=await context.request.post(origin+"/api/auth/memberships",{
      headers:{origin},
      data:{membershipId:SEED_IDS.collegeAdminMembership,role},
    });
    expect(selection.status(),"The College Admin grant must be persisted").toBe(200);
  }
}

const ownExports=[
  {id:"people",url:"/api/college/people/export",header:'"Membership ID","Name","Email","Phone"'},
  {id:"contacts",url:"/api/college/contacts/export",header:'"Name","Roles","Email (learner masked)","Phone (masked)"'},
  {id:"faculty",url:"/api/college/roles/export?kind=FACULTY",header:'"Name","Email","Membership","Platform account"'},
  {id:"learners",url:"/api/college/roles/export?kind=LEARNER",header:'"Name","Email","Membership","Platform account"'},
] as const;

async function inspectScopedDownloads(page:Page){
  for(const item of ownExports){
    const response=await page.request.get(item.url);
    expect(response.status(),item.id+" must be allowed for current college").toBe(200);
    expect(response.headers()["content-type"],item.id).toContain("text/csv");
    expect(response.headers()["content-disposition"],item.id).toContain("attachment;");
    expect(response.headers()["cache-control"],item.id).toContain("no-store");
    const csv=await response.text();
    expect(csv.startsWith("\uFEFF"+item.header),item.id+" columns").toBe(true);
    expect(csv).not.toContain("identity_uid");
    expect(csv).not.toContain("auth_secret");
    expect(csv).not.toContain("otp_secret");
    if(item.id==="contacts"){
      expect(csv).toContain("Email (learner masked)");
      expect(csv).toContain("Phone (masked)");
    }
  }
}

test.describe("UX-G178 genuine device-authenticated People CSV journeys",()=>{
  test.describe.configure({mode:"serial"});
  test.skip(!enabled,"Needs isolated E2E PostgreSQL with development-only OTP QA contacts");

  for(const viewport of [{name:"desktop",width:1280,height:800},
    {name:"mobile",width:390,height:844}] as const){
    test("College Admin downloads four own-college CSVs on "+viewport.name,
      async({page,context},info)=>{
        test.setTimeout(150000);
        await signInWithRealOtp(context,"collegeadmin.seed@example.com","COLLEGE_ADMIN");
        await page.setViewportSize(viewport);
        await page.goto("/college/people");
        await expect(page.locator("main").first()).toBeVisible();
        await inspectScopedDownloads(page);
        // An actual browser file download using the OTP-backed first-party
        // device cookie, not a synthetic data URL or API response mock.
        const promise=page.waitForEvent("download");
        await page.evaluate(()=>{
          const anchor=document.createElement("a");
          anchor.href="/api/college/contacts/export";
          document.body.append(anchor);anchor.click();anchor.remove();
        });
        const download=await promise;
        expect(download.suggestedFilename()).toBe("college-contacts.csv");
        const filepath=await download.path();
        expect(filepath).toBeTruthy();
        expect((await readFile(filepath!,"utf8")).startsWith(
          '\uFEFF"Name","Roles","Email (learner masked)"',
        )).toBe(true);
        expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth))
          .toBeLessThanOrEqual(2);
        await page.screenshot({path:info.outputPath("g178-otp-people-"+viewport.name+".png"),
          fullPage:true});

        for(const invalid of [
          "/api/college/people/export?collegeId="+SEED_IDS.collegeB,
          "/api/college/roles/export?kind=FACULTY&kind=LEARNER",
          "/api/college/contacts/export?joinedFrom=2027-12-31&joinedThrough=2027-01-01",
        ]){
          const bad=await page.request.get(invalid);
          expect(bad.status(),invalid+" must reject ambiguous or foreign filters").toBeGreaterThanOrEqual(400);
          expect(bad.headers()["content-type"]??"").not.toContain("text/csv");
        }
      });
  }

  test("two-factor Super Admin can download bounded People CSV without private contact fields",
    async({page,context},info)=>{
      await signInWithRealOtp(context,"superadmin.seed@example.com");
      await page.setViewportSize({width:1280,height:800});
      const report=await page.request.get("/api/admin/people/export");
      expect(report.status()).toBe(200);
      expect(report.headers()["content-type"]).toContain("text/csv");
      expect(report.headers()["content-disposition"]).toContain("super-admin-people-ist.csv");
      expect(report.headers()["cache-control"]).toContain("no-store");
      expect(report.headers()["x-export-row-cap"]).toBe("500");
      const csv=await report.text();
      expect(csv.startsWith('\uFEFF"Membership ID","Name","College","Roles"')).toBe(true);
      expect(csv).not.toMatch(/phone_e164|identity_uid|auth_secret|otp_secret/i);
      await page.goto("/admin/people");
      await expect(page.locator("main").first()).toBeVisible();
      await page.screenshot({path:info.outputPath("g178-otp-superadmin-people-desktop.png"),
        fullPage:true});
    });

  test("College Admin receives actionable student and Faculty CSV preflight errors without writes",
    async({page,context})=>{
      await signInWithRealOtp(context,"collegeadmin.seed@example.com","COLLEGE_ADMIN");
      for(const item of [
        {url:"/api/people/student-import",body:{action:"PREVIEW",csv:"bad,header\r\nunknown,record"}},
        {url:"/api/college/faculty/import",body:{action:"PREVIEW",csv:"bad,header\r\nunknown,record"}},
      ]){
        const preflight=await page.request.post(item.url,{
          headers:{origin},data:item.body,
        });
        expect(preflight.status(),item.url+" should show a non-mutating preview").toBe(200);
        const result=await preflight.json() as {
          report:{preview:boolean;structuralErrors:string[];results:unknown[];valid:number};
        };
        expect(result.report.preview).toBe(true);
        expect(result.report.structuralErrors).toContain("INVALID_CSV_HEADER");
        expect(result.report.results).toHaveLength(0);
        expect(result.report.valid).toBe(0);
        const unconfirmed=await page.request.post(item.url,{
          headers:{origin},
          data:{...item.body,action:"IMPORT",confirm:false},
        });
        expect(unconfirmed.status(),item.url+" must reject unconfirmed imports")
          .toBeGreaterThanOrEqual(400);
        expect(unconfirmed.headers()["cache-control"]??"").not.toContain("public");
      }
      const forged=await page.request.post("/api/people/student-import",{
        headers:{origin},data:{action:"PREVIEW",csv:"bad,header\r\nx,y",
          collegeId:SEED_IDS.collegeB},
      });
      expect(forged.status(),"A client-provided target college is forbidden")
        .toBeGreaterThanOrEqual(400);
    });

  test("a seeded role cookie cannot stand in for fresh OTP authorization",
    async({page,context})=>{
      await authenticateGracefulRole(context,"college");
      for(const url of ownExports.map(x=>x.url)){
        const denied=await page.request.get(url);
        expect([401,403],url+" must reject E2E impersonation as a device proof")
          .toContain(denied.status());
        expect(denied.headers()["content-type"]??"").not.toContain("text/csv");
        expect(denied.headers()["content-disposition"]??"").not.toContain("attachment");
      }
    });
});
