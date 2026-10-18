import {expect,test} from "@playwright/test";
import {authenticateGracefulRole} from "./support/roles";
import {expectNoRawErrors} from "./support/no-raw-error";
import {SEED_IDS} from "../../scripts/db-seed-data";

const e2eReady=Boolean(process.env.E2E_AUTH_SECRET)&&process.env.E2E_AUTH_ENABLED==="true";
test.describe("FAC-courses-01 Faculty authentication, deep links and page resilience",()=>{
 test.skip(!e2eReady,"Needs seeded E2E Faculty/Learner sessions and enabled harness");

 for(const view of [
  {name:"phone",width:390,height:844},
  {name:"desktop",width:1280,height:800},
 ]){
  test(`Learner cannot open guessed /teacher pages in ${view.name} viewport`,async({page,context})=>{
   await authenticateGracefulRole(context,"learner");
   await page.setViewportSize({width:view.width,height:view.height});
   const targets=[
    "/teacher/courses",
    "/teacher/courses/"+SEED_IDS.collegeB+"/gradebook",
    "/teacher/report/quiz/"+SEED_IDS.collegeB,
   ];
   for(const target of targets){
    await page.goto(target);
    await expect(page).not.toHaveURL(/\/teacher\//);
    await expectNoRawErrors(page);
    const body=await page.locator("body").innerText();
    expect(body).not.toContain("Published gradebook");
   }
  });
 }

 test("Faculty changing to the other college cannot reuse prior college's course URL",async({page,context})=>{
  await authenticateGracefulRole(context,"faculty");
  await page.goto("/teacher/courses");
  const first=page.getByRole("link",{name:/E2E Browser Course/}).first();
  const href=await first.getAttribute("href");
  expect(href).toMatch(/\/teacher\/courses\//);
  await context.addCookies([{
   name:"lms_membership",value:SEED_IDS.facultyCollegeBMembership,
   url:"http://localhost:3000",httpOnly:true,sameSite:"Lax",
  }]);
  await page.goto(href!);
  await expect(page.getByText("E2E Section A Secret",{exact:true})).toHaveCount(0);
  await expectNoRawErrors(page);
 });

 test("Faculty /teacher layout retains keyboard skip target on narrow screens",async({page,context})=>{
  await authenticateGracefulRole(context,"faculty");
  await page.setViewportSize({width:390,height:844});
  await page.goto("/teacher/courses");
  const skip=page.getByRole("link",{name:"Skip to faculty content"});
  await page.keyboard.press("Tab");
  await expect(skip).toBeFocused();
  await skip.press("Enter");
  await expect(page.locator("#faculty-page-content")).toBeFocused();
  await expectNoRawErrors(page);
 });
});
