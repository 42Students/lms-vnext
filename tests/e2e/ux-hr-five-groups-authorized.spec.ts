import { expect, test } from "@playwright/test";
import { authenticateGracefulRole } from "./support/roles";
import { captureUncaughtErrors, expectNoRawErrors } from "./support/no-raw-error";

const enabled=Boolean(process.env.E2E_AUTH_SECRET)&&process.env.E2E_AUTH_ENABLED==="true";
const viewports=[
  {name:"desktop",width:1280,height:800},
  {name:"mobile",width:390,height:844},
] as const;
const routes=[
  {group:"UX-G053",path:"/hr/activity"},
  {group:"UX-G053",path:"/hr/calendar"},
  {group:"UX-G053",path:"/hr/company"},
  {group:"UX-G053",path:"/hr/conversations"},
  {group:"UX-G054",path:"/hr/drives"},
  {group:"UX-G055",path:"/hr/home"},
  {group:"UX-G055",path:"/hr/drives/new"},
  {group:"UX-G056",path:"/hr/profile"},
  {group:"UX-G056",path:"/hr/round-results"},
] as const;

test.describe("Five HR groups: authenticated recruiter browser acceptance",()=>{
  test.skip(!enabled,"Needs disposable PG17 seeded recruiter with first-party E2E auth");
  for(const viewport of viewports) {
    for(const route of routes) {
      test(route.group+" "+viewport.name+" "+route.path+" renders role-scoped recruiter workspace",async({page,context})=>{
        test.setTimeout(90_000);
        await authenticateGracefulRole(context,"recruiter");
        await page.setViewportSize({width:viewport.width,height:viewport.height});
        const errors=captureUncaughtErrors(page);
        await page.goto(route.path);
        await expect(page.locator('[data-authenticated-canvas="true"]')).toBeVisible({timeout:30000});
        await expect(page.getByRole("heading",{level:1}).first()).toBeVisible();
        await expectNoRawErrors(page);
        expect(await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth))
          .toBeLessThanOrEqual(2);
        expect(errors).toEqual([]);
        if(["/hr/calendar","/hr/drives","/hr/profile","/hr/home"].includes(route.path)){
          await page.screenshot({path:"test-results/ux-hr-five-groups/recruiter-"+route.group+"-"+route.path.split("/").pop()+"-"+viewport.name+".png",fullPage:true});
        }
      });
    }
  }

  test("UX-G142 recruiter notification bell can open accessible scoped drawer",async({page,context})=>{
    await authenticateGracefulRole(context,"recruiter");
    await page.setViewportSize({width:390,height:844});
    await page.goto("/hr/home");
    const bell=page.getByRole("button",{name:/^Notifications(?:, \d+ new)?$/}).first();
    await expect(bell).toBeVisible({timeout:20000});
    await bell.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("heading",{name:"Notifications"}).last()).toBeVisible();
    await expectNoRawErrors(page);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth))
      .toBeLessThanOrEqual(2);
  });

  test("a Learner cannot enter any recruiter section directly",async({page,context})=>{
    await authenticateGracefulRole(context,"learner");
    for(const route of ["/hr/calendar","/hr/drives","/hr/home","/hr/profile","/hr/round-results"]){
      await page.goto(route);
      await expect(page).toHaveURL(/\/dashboard(?:[?#].*)?$/);
      await expectNoRawErrors(page);
    }
  });
});
