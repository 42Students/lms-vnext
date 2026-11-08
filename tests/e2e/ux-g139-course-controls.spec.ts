import { expect, test, type Page } from "@playwright/test";
import { authenticateGracefulRole } from "./support/roles";
import { SEED_IDS } from "../../scripts/db-seed-data";

const noOverflow=(page:Page)=>page.evaluate(()=>
  document.documentElement.scrollWidth<=window.innerWidth+1);

async function selectSeedCollege(context:import("@playwright/test").BrowserContext){
  await authenticateGracefulRole(context,"superadmin");
  // Select through the server-enforced permission boundary, not manually
  // injected scope cookies; this also creates the bounded expiry cookie.
  const selected=await context.request.post("http://localhost:3000/api/auth/admin-scope",{
    data:{kind:"college",collegeId:SEED_IDS.collegeA},
    headers:{Origin:"http://localhost:3000"},
  });
  expect(selected.ok(),"seeded Super Admin can select its authorized college").toBe(true);
  const response=await selected.json() as {scope?:{organizationId:string;collegeId:string}};
  expect(response.scope?.organizationId).toBe(SEED_IDS.organization);
  expect(response.scope?.collegeId).toBe(SEED_IDS.collegeA);
}

test.describe("UX-G139 course authoring and learner controls",()=>{
 test.skip(!process.env.E2E_AUTH_SECRET||process.env.E2E_AUTH_ENABLED!=="true",
  "Requires isolated seeded browser database");

 test("390px Super Admin resources have accessible, filter-preserving lesson search",async({page,context})=>{
  await selectSeedCollege(context);
  await page.setViewportSize({width:390,height:844});
  await page.goto("/admin/resources");
  await expect(page.getByRole("heading",{name:"Resources",level:1})).toBeVisible();
  const search=page.getByRole("search",{name:"Find a course or lesson to add content"});
  await expect(search).toBeVisible();
  const input=search.getByRole("searchbox",{name:"Find a course or lesson"});
  await input.fill("UX course");
  await search.getByRole("button",{name:"Find lessons"}).click();
  await expect(page).toHaveURL(/lessonSearch=UX(?:\+|%20)course/);
  await expect(page.getByRole("navigation",{name:"Authoring lesson pages"})).toBeVisible();
  expect(await noOverflow(page)).toBe(true);
  await page.screenshot({path:"test-results/ux-g139-resources-mobile-390.png",fullPage:true});
 });

 test("1280px Super Admin lesson creation retains clear validation and navigation",async({page,context})=>{
  await selectSeedCollege(context);
  await page.setViewportSize({width:1280,height:850});
  await page.goto("/admin/lessons");
  await expect(page.getByRole("heading",{name:"Lessons",level:1})).toBeVisible();
  const creation=page.getByRole("region",{name:"Create New Lesson"});
  if(await creation.count()) {
    await expect(creation).toBeVisible();
    await expect(creation.getByRole("searchbox",{name:"Search courses"})).toBeVisible();
  }else {
    await expect(page.getByText("No courses in this college yet")).toBeVisible();
  }
  expect(await noOverflow(page)).toBe(true);
  await page.screenshot({path:"test-results/ux-g139-lessons-desktop-1280.png",fullPage:true});
 });

 test("learner cannot open privileged content authoring",async({page,context})=>{
  await authenticateGracefulRole(context,"learner");
  await page.goto("/admin/resources");
  await expect(page.getByRole("search",{name:"Find a course or lesson to add content"})).toHaveCount(0);
  await expect(page.getByRole("heading",{name:"Add Resource"})).toHaveCount(0);
  // Server deliberately keeps the attempted URL while rendering its hard
  // permission-denied boundary. Verify the denial, not a redirect assumption.
  await expect(page.getByRole("heading",{name:"Access denied",level:1})).toBeVisible();
  await expect(page.getByRole("heading",{name:/not authorized to access Superadmin/})).toBeVisible();
  await expect(page.getByRole("link",{name:"Return to dashboard"})).toHaveAttribute("href","/dashboard");
 });
});
