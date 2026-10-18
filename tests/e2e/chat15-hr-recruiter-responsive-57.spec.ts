import {expect,test} from "@playwright/test";
import {authenticateGracefulRole} from "./support/roles";
import {captureUncaughtErrors,expectNoRawErrors} from "./support/no-raw-error";

const enabled=Boolean(process.env.E2E_AUTH_SECRET)&&
 process.env.E2E_AUTH_ENABLED==="true";
const routes=[
 {url:"/hr/home",heading:/./},
 {url:"/hr/drives",heading:"Drives"},
 {url:"/hr/calendar",heading:"Calendar"},
 {url:"/hr/conversations",heading:"Messages"},
 {url:"/hr/company",heading:"Company & Team"},
 {url:"/hr/profile",heading:"Profile"},
 {url:"/hr/notifications",heading:"Notifications"},
 {url:"/hr/activity",heading:"Hiring activity"},
] as const;

test.describe("UX-HR-BROWSER-57 authenticated Recruiter phone and keyboard journey",()=>{
 test.skip(!enabled,"Requires a seeded, verified recruiter identity with active college grant");
 for(const width of [320,390]){
  for(const route of routes){
   test(`UX-HR-BROWSER-57 ${route.heading} at ${width}px keeps scoped navigation and usable layout`,
    async({page,context})=>{
     test.setTimeout(90_000);
     await authenticateGracefulRole(context,"recruiter");
     await page.setViewportSize({width,height:780});
     const errors=captureUncaughtErrors(page);
     await page.goto(route.url);
     await expect(page.getByRole("heading",{level:1,name:route.heading}).first())
      .toBeVisible({timeout:20_000});
     await expect(page.locator("nextjs-portal")).toHaveCount(0);
     expect(await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth))
      .toBeLessThanOrEqual(2);
     await expectNoRawErrors(page);
     expect(errors).toEqual([]);
    });
  }
 }
 test("UX-HR-BROWSER-57 learner account cannot use direct recruiter routes or private drive ID",async({page,context})=>{
  await authenticateGracefulRole(context,"learner");
  for(const route of [
   "/hr/home","/hr/drives","/hr/company","/hr/notifications",
   "/recruiter/drives/123e4567-e89b-42d3-a456-426614174001",
  ]){
   await page.goto(route);
   await expect(page).toHaveURL(/\/dashboard(?:[?#].*)?$/);
   await expectNoRawErrors(page);
  }
 });
});
