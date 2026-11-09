import { expect, test, type Page } from "@playwright/test";
import { authenticateGracefulRole } from "./support/roles";

const routes = [
  ["UX-G098", "Back to TPO home", "/tpo/home"],
  ["UX-G099", "Back to batches", "/tpo/batches"],
  ["UX-G100", "Back to TPO home", "/tpo/home"],
  ["UX-G101", "Back to calendar", "/tpo/calendar"],
  ["UX-G102", "Back to companies", "/tpo/companies"],
  ["UX-G104", "Back to TPO home", "/tpo/home"],
  ["UX-G105", "Back to placements", "/tpo/placements"],
  ["UX-G106", "Back to placements", "/tpo/placements"],
  ["UX-G107", "Back to placements", "/tpo/placements"],
  ["UX-G108", "Back to placements", "/tpo/placements"],
] as const;
const dimensions = [
  {name:"desktop",width:1280,height:800},
  {name:"mobile",width:390,height:844},
] as const;
async function noHorizontalOverflow(page:Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth+1)).toBe(true);
}
test.describe("TPO ten route fallbacks — actual components, keyboard and responsive layouts",()=>{
  for (const size of dimensions) {
    for (const [group,label,href] of routes) {
      test(group+" "+size.name+" retry, safe exit and private-message suppression",async({page},info)=>{
        test.setTimeout(90_000);
        await page.setViewportSize(size);
        const runtimeErrors:string[]=[];
        page.on("pageerror",e=>runtimeErrors.push(e.message));
        await page.goto("/e2e/ux-tpo-ten-recovery?group="+group);
        const section=page.getByRole("region",{name:group+" recovery"});
        await expect(section.getByRole("heading",{name:group+" recovery acceptance"})).toBeVisible();
        const exit=section.getByRole("link",{name:label});
        await expect(exit).toHaveAttribute("href",href);
        const retry=section.getByRole("button",{name:/Retry/});
        await expect(retry).toBeVisible();
        await retry.click();
        await expect(section.getByRole("status")).toContainText("Retry count: 1");
        await exit.focus(); await expect(exit).toBeFocused();
        await expect(page.locator("body")).not.toContainText("fixture-private-tenant-token");
        await noHorizontalOverflow(page);
        await page.screenshot({path:info.outputPath(group+"-"+size.name+".png"),fullPage:true});
        expect(runtimeErrors).toEqual([]);
      });
    }
  }
});

test.describe("TPO role denial on actual server pages",()=>{
  test.skip(process.env.E2E_AUTH_ENABLED!=="true"||!process.env.E2E_AUTH_SECRET,"Needs seeded PostgreSQL17 and temporary identities");
  for(const size of dimensions) {
    test(size.name+" learner cannot open the TPO company, batch or placement management pages",async({page,context},info)=>{
      test.setTimeout(90_000);
      await authenticateGracefulRole(context,"learner");
      await page.setViewportSize(size);
      for (const path of ["/tpo/companies","/tpo/batches","/tpo/placements"]) {
        await page.goto(path,{waitUntil:"domcontentloaded"});
        await expect(page).toHaveURL(/\/(?:dashboard(?:[?#]|$)|learn\/courses\?access=denied(?:&|$))/);
        await expect(page.getByRole("button",{name:/create drive|save placement|archive company/i})).toHaveCount(0);
        await noHorizontalOverflow(page);
      }
      await page.screenshot({path:info.outputPath("role-denial-"+size.name+".png"),fullPage:true});
    });
  }
});


/** These exercise the authenticated production routes, not the recovery fixture. */
test.describe("UX-G098–G102 real TPO routes: ambiguous filters and accessible recovery",()=>{
  test.skip(process.env.E2E_AUTH_ENABLED!=="true"||!process.env.E2E_AUTH_SECRET,
    "Needs disposable PostgreSQL and seeded TPO membership");
  const productionCases=[
    ["UX-G098","/tpo/home?seasonId=first&seasonId=second","Invalid placement home filters","Clear home filters","/tpo/home"],
    ["UX-G099","/tpo/batches?page=1&page=2","Invalid batch filters","Clear filters","/tpo/batches"],
    ["UX-G100","/tpo/calendar?view=week&view=day","Invalid calendar filters","Reset calendar filters","/tpo/calendar"],
    ["UX-G101","/tpo/calendar/interviews?days=7&days=30","Invalid interview filters","Clear interview filters","/tpo/calendar/interviews"],
    ["UX-G102","/tpo/companies?sort=NAME&sort=DRIVES","Invalid companies filters","Clear filters","/tpo/companies?directory=1"],
  ] as const;
  for(const size of dimensions){
    for(const [group,path,message,label,href] of productionCases){
      test(group+" "+size.name+" rejects repeated filters before data lookup",async({page,context},info)=>{
        test.setTimeout(120_000);
        await authenticateGracefulRole(context,"tpo");
        await page.setViewportSize(size);
        const runtimeErrors:string[]=[];
        page.on("pageerror",e=>runtimeErrors.push(e.message));
        await page.goto(path,{waitUntil:"domcontentloaded"});
        await expect(page.getByText(message,{exact:false}).first()).toBeVisible();
        const reset=page.getByRole("link",{name:label});
        await expect(reset).toHaveAttribute("href",href);
        await reset.focus();
        await expect(reset).toBeFocused();
        await expect(page.locator("body")).not.toContainText("fixture-private-tenant-token");
        await noHorizontalOverflow(page);
        await page.screenshot({path:info.outputPath(group+"-"+size.name+"-production-invalid-filter.png"),fullPage:true});
        expect(runtimeErrors).toEqual([]);
      });
    }
  }
});


test.describe("UX-G099–G101 real protected depth and error-free filter reset",()=>{
  test.skip(process.env.E2E_AUTH_ENABLED!=="true"||!process.env.E2E_AUTH_SECRET,
    "Requires seeded PostgreSQL TPO authentication");
  const cases=[
    ["UX-G099","/tpo/batches/00000000-0000-4000-8000-000000000000/history?kind=DECIDE&kind=UNDO","Invalid or repeated history filter.","Reset","/tpo/batches/00000000-0000-4000-8000-000000000000/history"],
    ["UX-G100","/tpo/calendar/rounds?page=1&page=2","Invalid round filters","Clear round filters","/tpo/calendar/rounds"],
    ["UX-G101","/tpo/calendar/interviews?days=not-a-number","Invalid interview filters","Clear interview filters","/tpo/calendar/interviews"],
  ] as const;
  for(const size of dimensions){
    for(const [group,path,text,label,href] of cases){
      test(group+" "+size.name+" never silently accepts malformed deep links",async({page,context},info)=>{
        test.setTimeout(120_000);
        await authenticateGracefulRole(context,"tpo");
        await page.setViewportSize(size);
        await page.goto(path,{waitUntil:"domcontentloaded"});
        await expect(page.getByText(text,{exact:false}).first()).toBeVisible();
        const reset=page.getByRole("link",{name:label});
        await expect(reset).toHaveAttribute("href",href);
        await reset.focus();
        await expect(reset).toBeFocused();
        await noHorizontalOverflow(page);
        await page.screenshot({path:info.outputPath(group+"-"+size.name+"-deep-link-recovery.png"),fullPage:true});
      });
    }
  }
});


test.describe("UX-G098 and G102 real route recovery on operational pages",()=>{
  test.skip(process.env.E2E_AUTH_ENABLED!=="true"||!process.env.E2E_AUTH_SECRET,
    "Requires disposable PostgreSQL and TPO role");
  const cases=[
    ["UX-G098","/tpo/announcements?tab=yours&tab=team","Invalid announcement filters","Return to announcements","/tpo/announcements"],
    ["UX-G102","/tpo/drive-day?q=one&q=two","Invalid drive day filter","Clear filters","/tpo/drive-day"],
    ["UX-G102","/tpo/companies/today?view=focus&view=agenda","Invalid view parameters","Open My Work","/tpo/companies/today"],
  ] as const;
  for(const size of dimensions){
    for(const [group,path,notice,linkLabel,href] of cases){
      test(group+" "+size.name+" "+path+" avoids ambiguous reads and exposes safe return",async({page,context},info)=>{
        test.setTimeout(120_000);
        await authenticateGracefulRole(context,"tpo");
        await page.setViewportSize(size);
        await page.goto(path,{waitUntil:"domcontentloaded"});
        await expect(page.getByText(notice,{exact:false}).first()).toBeVisible();
        const back=page.getByRole("link",{name:linkLabel});
        await expect(back).toHaveAttribute("href",href);
        await back.focus();
        await expect(back).toBeFocused();
        await noHorizontalOverflow(page);
        await page.screenshot({path:info.outputPath(group+"-"+size.name+"-operations-safe-return.png"),fullPage:true});
      });
    }
  }
});


test.describe("UX-G098–G102 actual authorized TPO page shells and empty/error recovery",()=>{
  test.skip(process.env.E2E_AUTH_ENABLED!=="true"||!process.env.E2E_AUTH_SECRET,
    "Requires seeded TPO identity and disposable PostgreSQL");
  const routes=[
    ["UX-G098","/tpo/announcements"],
    ["UX-G098","/tpo/audit"],
    ["UX-G098","/tpo/batches"],
    ["UX-G100","/tpo/calendar"],
    ["UX-G101","/tpo/calendar/interviews"],
    ["UX-G101","/tpo/companies?directory=1"],
    ["UX-G102","/tpo/companies/archived"],
    ["UX-G102","/tpo/drive-day"],
  ] as const;
  for(const size of dimensions){
    for(const [group,path] of routes){
      test(group+" "+size.name+" normal page "+path+" remains navigable for TPO",async({page,context},info)=>{
        test.setTimeout(120_000);
        await authenticateGracefulRole(context,"tpo");
        await page.setViewportSize(size);
        await page.goto(path,{waitUntil:"domcontentloaded"});
        await expect(page).toHaveURL(/\/tpo\//);
        await expect(page.locator("h1").first()).toBeVisible();
        await expect(page.locator("body")).not.toContainText("Application error: a server-side exception");
        await noHorizontalOverflow(page);
        await page.screenshot({path:info.outputPath(group+"-"+size.name+"-"+path.replace(/[^a-z0-9]/gi,"-")+".png"),fullPage:true});
      });
    }
  }
});


test.describe("UX-G098 authenticated audit filter boundaries and privileged CSV denial",()=>{
  test.skip(process.env.E2E_AUTH_ENABLED!=="true"||!process.env.E2E_AUTH_SECRET,
    "Needs seeded TPO and Learner identities in isolated PostgreSQL");

  const malformedAuditCases=[
    ["/tpo/audit?kind=ALL&kind=ROUND","/tpo/audit"],
    ["/tpo/audit?collegeId=00000000-0000-4000-8000-000000000000","/tpo/audit"],
    ["/tpo/audit/actors?sort=NEWEST&sort=OLDEST","/tpo/audit/actors"],
    ["/tpo/audit/actors?collegeId=00000000-0000-4000-8000-000000000000","/tpo/audit/actors"],
  ] as const;
  for(const size of dimensions){
    for(const [path,resetHref] of malformedAuditCases){
      test("UX-G098 "+size.name+" "+path+" rejects ambiguous and foreign audit filters",async({page,context},info)=>{
        test.setTimeout(120_000);
        await authenticateGracefulRole(context,"tpo");
        await page.setViewportSize(size);
        await page.goto(path,{waitUntil:"domcontentloaded"});
        await expect(page.getByText("Invalid audit filters",{exact:false}).first()).toBeVisible();
        const clear=page.getByRole("link",{name:"Clear filters"});
        await expect(clear).toHaveAttribute("href",resetHref);
        await clear.focus();
        await expect(clear).toBeFocused();
        await noHorizontalOverflow(page);
        await page.screenshot({path:info.outputPath("G098-"+size.name+"-"+path.replace(/[^a-z0-9]/gi,"-")+".png"),fullPage:true});
      });
    }
    for(const role of ["tpo","learner"] as const){
      for(const path of ["/api/placements/tpo/audit/export","/api/placements/tpo/audit/actors/export"]){
        test("UX-G098 "+size.name+" "+role+" E2E session cannot bypass step-up CSV "+path,async({context})=>{
          test.setTimeout(120_000);
          await authenticateGracefulRole(context,role);
          const response=await context.request.get("http://localhost:3000"+path);
          expect([401,403],"A test-only identity must not satisfy recent device authentication").toContain(response.status());
          expect(response.headers()["content-type"]??"").not.toContain("text/csv");
          expect(response.headers()["cache-control"]??"").toContain("no-store");
        });
      }
    }
  }
});


test.describe("UX-G098 persisted actor audit and announcement search boundary",()=>{
  test.skip(process.env.E2E_AUTH_ENABLED!=="true"||!process.env.E2E_AUTH_SECRET,
    "Requires the disposable two-college audit fixture, seeded before Playwright");
  const subject="ux-g098-ci-alpha-event";
  for(const size of dimensions){
    test("UX-G098 "+size.name+" reads a persisted audit event and retains its scoped export filters",async({page,context},info)=>{
      test.setTimeout(120_000);
      await authenticateGracefulRole(context,"tpo");
      await page.setViewportSize(size);
      await page.goto("/tpo/audit/actors?entityType=ux_g098_evidence&entityId="+subject,
        {waitUntil:"domcontentloaded"});
      await expect(page.getByText("1 matching canonical record(s)")).toBeVisible();
      await expect(page.getByText(subject,{exact:true})).toBeVisible();
      await expect(page.locator("body")).not.toContainText("ux-g098-ci-beta-event");
      const exportLink=page.getByRole("link",{name:/Export matching CSV/});
      await expect(exportLink).toHaveAttribute("href",/entityId=ux-g098-ci-alpha-event/);
      await expect(exportLink).toHaveAttribute("href",/entityType=ux_g098_evidence/);
      await noHorizontalOverflow(page);
      await page.screenshot({path:info.outputPath("G098-"+size.name+"-persisted-actor-audit.png"),fullPage:true});
    });
    for(const search of ["page=bad","mine=other","collegeId=00000000-0000-4000-8000-000000000000"]){
      test("UX-G098 "+size.name+" announcement query "+search+" never silently changes the requested view",async({page,context})=>{
        test.setTimeout(120_000);
        await authenticateGracefulRole(context,"tpo");
        await page.setViewportSize(size);
        await page.goto("/tpo/announcements?"+search,{waitUntil:"domcontentloaded"});
        await expect(page.getByText("Invalid announcement filters",{exact:false}).first()).toBeVisible();
        await expect(page.getByRole("link",{name:"Return to announcements"})).toHaveAttribute("href","/tpo/announcements");
        await noHorizontalOverflow(page);
      });
    }
  }
});
