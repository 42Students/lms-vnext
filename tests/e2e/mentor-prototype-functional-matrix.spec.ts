import {expect,test,type BrowserContext} from "@playwright/test";
import {E2E_IDENTITY_COOKIE_NAME,E2E_SECRET_COOKIE_NAME}
 from "../../src/auth/e2e-identity";
import {SEED_IDS} from "../../scripts/db-seed-data";

const origin="http://localhost:3000";
const secret=process.env.E2E_AUTH_SECRET;

/** Real authenticated routes: neither the visual screenshot gate nor a mock
 * successful mutation. Skip detail assertions when seed has no owned project. */
async function signIn(
 context:BrowserContext,user:string,membershipId:string,
 role:"MENTOR"|"LEARNER"|"FACULTY"="MENTOR",
) {
 if(!secret)throw new Error("E2E_AUTH_SECRET is required");
 await context.clearCookies();
 await context.addCookies([
  {name:E2E_IDENTITY_COOKIE_NAME,value:user,url:origin,httpOnly:true,sameSite:"Lax"},
  {name:E2E_SECRET_COOKIE_NAME,value:secret,url:origin,httpOnly:true,sameSite:"Lax"},
  {name:"lms_membership",value:membershipId,url:origin,httpOnly:true,sameSite:"Lax"},
  {name:"lms_role",value:role,url:origin,httpOnly:true,sameSite:"Lax"},
 ]);
}

test.describe("Mentor #45–56 source-functional route matrix",()=>{
 test.skip(!secret,"Requires authenticated disposable Mentor seed");

 test("mentor portfolio and cross-team surfaces respond to the authenticated role",async({page,context})=>{
  await signIn(context,"seed-shared-faculty",SEED_IDS.facultyCollegeAMembership);
  for(const [path,heading] of [
   ["/mentor/projects","__DYNAMIC_MENTOR_ATTENTION_HEADING__"],
   ["/mentor/calendar","Meetings"],
   ["/mentor/notifications","Notifications"],
   ["/mentor/search","Search"],
   ["/mentor/account","Mentor · My account"],
  ] as const){
   await page.goto(path);
   if(heading==="__DYNAMIC_MENTOR_ATTENTION_HEADING__")
    await expect(page.locator(".prototype-mentor-home-heading h1")).toBeVisible();
   else await expect(page.getByRole("heading",{level:1,name:heading})).toBeVisible();
   await expect(page.locator("body")).not.toContainText("Application error: a server-side exception");
  }
 });

 test("each of the seven prototype project tabs renders from an authorized project",async({page,context})=>{
  await signIn(context,"seed-shared-faculty",SEED_IDS.facultyCollegeAMembership);
  await page.goto("/mentor/projects");
  const paths=await page.locator("a[href^='/mentor/projects/']").evaluateAll(nodes=>
   nodes.map(node=>node.getAttribute("href")??"")
    .map(href=>href.split("?")[0]??"")
    .filter(href=>/^\/mentor\/projects\/[0-9a-f-]{36}$/i.test(href)),
  );
  const project=[...new Set(paths)][0];
  // An isolated Mentor CI run must exercise all seven tabs, never skip.
  if(!project&&process.env["MENTOR_E2E_SEED_PROJECT"]==="true")
    throw new Error("The persisted Mentor acceptance project was not found.");
  test.skip(!project,"No assigned Mentor project in disposable seed");
  const base=project!;
  const tabs=[
   ["overview","Overview"],["board","Board"],["sprints","Sprints & releases"],
   ["team","Team & meetings"],["performance","Performance"],
   ["resources","Resources"],["activity","Activity"],
  ] as const;
  for(const [key,label] of tabs){
   await page.goto(base+"?tab="+key);
   await expect(page.getByRole("heading",{level:1}).first()).toBeVisible();
   await expect(page.getByRole("navigation",{name:"Project sections"})
    .getByRole("link",{name:label,exact:true})).toHaveAttribute("aria-current","page");
   await expect(page.getByText("No project content available for this section."))
    .toHaveCount(0);
  }
  // Screen #53 is a separate final-delivery state beyond the seven tabs.
  await page.goto(base+"?tab=delivery");
  await expect(page.getByRole("heading",{level:1}).first()).toBeVisible();
  await expect(page.getByText("No project content available for this section."))
   .toHaveCount(0);
  await expect(page.locator("body"))
   .not.toContainText("Application error: a server-side exception");
  await page.goto(base+"?tab=tasks");
  await expect(page).toHaveURL(base+"?tab=board");
  await page.goto(base+"?tab=meetings");
  await expect(page).toHaveURL(base+"?tab=team");
  await page.goto(base+"?tab=definitely-invalid");
  await expect(page.getByText("No project content available for this section."))
    .toBeVisible();
 });

 test("a learner cannot open any Mentor route, including deep-linked project tabs",async({page,context})=>{
  await signIn(context,"seed-learner",SEED_IDS.learnerCollegeAMembership,"LEARNER");
  for(const path of ["/mentor/projects","/mentor/calendar",
    "/mentor/notifications","/mentor/search",
    "/mentor/projects/00000000-0000-4000-8000-000000000001?tab=board",
    "/mentor/projects/00000000-0000-4000-8000-000000000001/board-review"]){
   await page.goto(path);
   await expect(page).toHaveURL(/\/dashboard(?:[/?#]|$)/);
  }
 });

 test("a planned Mentor project shows read-only overview and sprint planning states",async({page,context})=>{
  await signIn(context,"seed-shared-faculty",SEED_IDS.facultyCollegeAMembership);
  await page.goto("/mentor/projects");
  const link=page.getByRole("link",{name:/E2E Mentor Acceptance Project.*Open project/}).first();
  if(process.env["MENTOR_E2E_SEED_PROJECT"]==="true")
   await expect(link).toBeVisible();
  else test.skip((await link.count())===0,"Requires the disposable Mentor acceptance project");
  const href=await link.getAttribute("href");
  expect(href).toMatch(/^\/mentor\/projects\/[0-9a-f-]{36}(?:\?.*)?$/i);
  const base=href!.split("?")[0]!;
  await page.goto(base+"?tab=overview");
  await expect(page.getByRole("heading",{level:1,name:"E2E Mentor Acceptance Project"})).toBeVisible();
  await expect(page.locator(".prototype-mentor-title-line")).toContainText("Planned");
  await expect(page.getByRole("link",{name:/Edit project brief/})).toHaveCount(0);
  await page.goto(base+"?tab=sprints");
  await expect(page.getByRole("navigation",{name:"Project sections"})
   .getByRole("link",{name:"Sprints & releases",exact:true})).toHaveAttribute("aria-current","page");
  await expect(page.getByRole("region",{name:"Plan a release or sprint"})).toHaveCount(0);
  await expect(page.getByRole("region",{name:"Sprint and release totals"})).toBeVisible();
 });

 test("a Faculty-only college switch cannot inherit the same user's other college Mentor grant",async({page,context})=>{
  // Deny an actual persisted College A project rather than only a synthetic UUID.
  await signIn(context,"seed-shared-faculty",SEED_IDS.facultyCollegeAMembership);
  await page.goto("/mentor/projects");
  const ownProject=page.getByRole("link",{name:/E2E Mentor Acceptance Project.*Open project/}).first();
  if(process.env["MENTOR_E2E_SEED_PROJECT"]==="true")
   await expect(ownProject).toBeVisible();
  else test.skip((await ownProject.count())===0,"Requires the disposable Mentor acceptance project");
  const projectHref=await ownProject.getAttribute("href");
  expect(projectHref).toMatch(/^\/mentor\/projects\/[0-9a-f-]{36}(?:\?.*)?$/i);
  const foreignProjectPath=projectHref!.split("?")[0]!+"?tab=team";
  await signIn(context,"seed-shared-faculty",SEED_IDS.facultyCollegeBMembership,"FACULTY");
  for(const path of ["/mentor/projects","/mentor/calendar",
    "/mentor/notifications","/mentor/search",
    foreignProjectPath]){
   await page.goto(path);
   await expect(page).toHaveURL(/\/dashboard(?:[/?#]|$)/);
  }
 });

 test("invalid project and notification filters offer an authorized clear path",async({page,context})=>{
  await signIn(context,"seed-shared-faculty",SEED_IDS.facultyCollegeAMembership);
  await page.goto("/mentor/projects?page=-1");
  await expect(page.getByText("Invalid Project filters")).toBeVisible();
  await expect(page.getByRole("link",{name:"Clear filters"}))
   .toHaveAttribute("href","/mentor/projects");
  await page.goto("/mentor/notifications?kind=INVALID");
  await expect(page.getByRole("heading",{name:"Invalid notification filters"})).toBeVisible();
  await expect(page.getByRole("link",{name:"Return to newest notifications"}))
   .toHaveAttribute("href","/mentor/notifications");
 });

 test("malformed calendar filters fail recoverably for an authenticated Mentor",async({page,context})=>{
  await signIn(context,"seed-shared-faculty",SEED_IDS.facultyCollegeAMembership);
  await page.goto("/mentor/calendar?period=INVALID");
  await expect(page.getByRole("heading",{name:"Invalid meeting filters"})).toBeVisible();
  await expect(page.getByRole("link",{name:"Clear filters"}))
   .toHaveAttribute("href","/mentor/calendar");
  await expect(page.locator("body"))
   .not.toContainText("Application error: a server-side exception");
 });
});
