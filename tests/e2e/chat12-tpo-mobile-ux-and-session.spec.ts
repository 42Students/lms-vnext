import {expect,test} from "@playwright/test";
import {authenticateGracefulRole} from "./support/roles";

const enabled=Boolean(process.env.E2E_AUTH_SECRET)&&
 process.env.E2E_AUTH_ENABLED==="true";
test.describe("PROJ-BREAK-TPO-E2E-01 TPO phone, focus and tenant session journeys",()=>{
 test.skip(!enabled,"Requires authenticated disposable E2E TPO and learner fixtures.");
 for(const width of [320,360,390]){
  test(`TPO Students at ${width}px has a reachable modal filter, Escape and focus return`,async({page,context})=>{
   test.setTimeout(90_000);
   await authenticateGracefulRole(context,"tpo");
   await page.setViewportSize({width,height:720});
   await page.goto("/tpo/students");
   await expect(page.getByRole("heading",{level:1,name:"Students"})).toBeVisible();
   const filter=page.getByRole("button",{name:/Filter students \(/}).first();
   await expect(filter).toBeVisible();
   await filter.focus();
   await filter.click();
   const modal=page.getByRole("dialog",{name:"Filter students"});
   await expect(modal).toBeVisible();
   await expect(modal.getByRole("button",{name:"Close sheet"})).toBeVisible();
   await page.keyboard.press("Escape");
   await expect(modal).toBeHidden();
   await expect(filter).toBeFocused();
   expect(await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth))
    .toBeLessThanOrEqual(2);
  });
 }
 for(const width of [320,390]){
  test(`TPO Companies at ${width}px retains directory navigation without document overflow`,async({page,context})=>{
   test.setTimeout(75_000);
   await authenticateGracefulRole(context,"tpo");
   await page.setViewportSize({width,height:720});
   await page.goto("/tpo/companies");
   await expect(page.getByRole("heading",{level:1,name:"Companies"})).toBeVisible();
   expect(await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth))
    .toBeLessThanOrEqual(2);
   await expect(page.getByRole("navigation",{name:"Company directory tabs"})).toBeVisible();
  });
 }
 test("learner membership cannot open TPO roster, including a pasted foreign student ID",async({page,context})=>{
  await authenticateGracefulRole(context,"learner");
  await page.goto("/tpo/students?student=aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
  await expect(page).toHaveURL(/\/dashboard(?:\?.*)?$/);
  await expect(page.getByRole("heading",{level:1,name:"Students"})).toHaveCount(0);
 });
});
