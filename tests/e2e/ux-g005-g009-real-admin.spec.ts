import {expect,test,type BrowserContext,type Page} from "@playwright/test";
import {authenticateGracefulRole} from "./support/roles";
import {SEED_IDS} from "../../scripts/db-seed-data";

const enabled=process.env.E2E_AUTH_ENABLED==="true"&&Boolean(process.env.E2E_AUTH_SECRET);
const origin="http://localhost:3000";
const adminBase="/admin/colleges/"+SEED_IDS.collegeA;
const targetAdmin=adminBase+"/admins/"+SEED_IDS.collegeAdminUser;

async function selectRealCollege(context:BrowserContext){
 await authenticateGracefulRole(context,"superadmin");
 const response=await context.request.post(origin+"/api/auth/admin-scope",{
  headers:{Origin:origin},data:{kind:"college",collegeId:SEED_IDS.collegeA},
 });
 expect(response.status(),"Persisted Super Admin scope selection must succeed").toBe(200);
 const data=await response.json() as {scope?:{collegeId?:string}};
 expect(data.scope?.collegeId).toBe(SEED_IDS.collegeA);
}
async function visiblePage(page:Page,path:string,heading:RegExp){
 const response=await page.goto(path);
 expect(response?.status(),path+" must return a successful authorized page").toBeLessThan(400);
 await expect(page.getByRole("heading",{level:1}).first()).toHaveText(heading,{timeout:30000});
}
const viewports=[{name:"desktop",width:1280,height:800},{name:"mobile",width:390,height:844}] as const;

test.describe("UX-G005–G009 seeded Super Admin page journeys",()=>{
 test.skip(!enabled,"Real Super Admin journey needs disposable seeded PostgreSQL");
 test.describe.configure({mode:"serial"});
 for(const size of viewports){
  test("selected-college authorized pages and navigation at "+size.name,async({page,context},info)=>{
   test.setTimeout(270000);
   await page.setViewportSize(size);
   await selectRealCollege(context);
   const visited=[
    {id:"g005-academics",path:"/admin/academics",heading:/Academic Setup/i},
    {id:"g006-audit",path:"/admin/audit",heading:/Audit|Activity/i},
    {id:"g006-promotion",path:"/admin/batch-promotion",heading:/Batch Promotion/i},
    {id:"g007-sessions",path:targetAdmin,heading:/Active sessions/i},
    {id:"g007-history",path:targetAdmin+"/history",heading:/History/i},
    {id:"g008-signin",path:adminBase+"/signin",heading:/./},
    {id:"g008-subdomain",path:adminBase+"/subdomain",heading:/./},
    {id:"g009-progress",path:"/admin/course-progress",heading:/Course Progress/i},
   ];
   for(const route of visited){
    await visiblePage(page,route.path,route.heading);
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
    expect(overflow,route.id+" overflow at "+size.name).toBeLessThanOrEqual(2);
    await page.screenshot({path:info.outputPath(route.id+"-"+size.name+".png"),fullPage:true});
   }
   // G005: the selected college has a persisted, teachable academic Section.
   await page.goto("/admin/academics");
   const sectionLink=page.locator('a[href^="/admin/academics/sections/"]').first();
   await expect(sectionLink).toBeVisible();
   await sectionLink.click();
   await expect(page.getByRole("heading",{level:1,name:/E2E Section/})).toBeVisible();
   await expect(page.getByRole("link",{name:"Back to Academics"}))
    .toHaveAttribute("href","/admin/academics");
   await page.screenshot({path:info.outputPath("g005-section-operations-"+size.name+".png"),fullPage:true});

   // G006: invalid audit and promotion inputs must recover without mutating data.
   await page.goto("/admin/audit?category=not-a-real-category");
   await expect(page.getByText("Invalid audit filters")).toBeVisible();
   await expect(page.getByRole("link",{name:"Clear filters"})).toHaveAttribute("href","/admin/audit");
   await page.goto("/admin/batch-promotion?yearStart=bad");
   await expect(page.getByText("Invalid batch promotion filters")).toBeVisible();
   await page.goto("/admin/batch-promotion");
   await expect(page.getByRole("search",{name:"Batch promotion preview filters"})).toBeVisible();
   await expect(page.getByRole("button",{name:"Preview"})).toBeVisible();

   // G007: session details must remain refreshable without calling the revoke endpoint.
   await page.goto(targetAdmin);
   await page.getByRole("button",{name:"View active sessions"}).click();
   await expect(page.getByRole("region",{name:"Administrator active device sessions"})).toBeVisible();

   // G008: saved policy and domain UI show their actual protected controls.
   await page.goto(adminBase+"/signin");
   await expect(page.getByRole("radiogroup",{name:"Sign-in methods"})).toBeVisible();
   await page.goto(adminBase+"/subdomain");
   await expect(page.getByRole("region",{name:"Managed college web address"})).toBeVisible();

   // G009: follow a real, persisted seeded batch/course offering into its learner report.
   await page.goto("/admin/course-progress");
   const progressFilters=page.getByRole("search",{name:"Select class and course progress"});
   await progressFilters.locator('select[name="cohortCode"]').selectOption("E2E-COHORT");
   await progressFilters.locator('select[name="courseCode"]').selectOption("E2E-COURSE");
   await progressFilters.getByRole("button",{name:/Refresh/}).click();
   await expect(page).toHaveURL(/cohortCode=E2E-COHORT/);
   const studentReport=page.getByRole("link",{name:/View student progress/}).first();
   await expect(studentReport).toBeVisible();
   await studentReport.click();
   await expect(page.getByRole("heading",{level:1,name:"Course Progress"})).toBeVisible();
   await page.screenshot({path:info.outputPath("g009-student-report-"+size.name+".png"),fullPage:true});

   await page.goto(targetAdmin+"/history");
   await expect(page.getByRole("link",{name:"Active sessions"}))
     .toHaveAttribute("href",targetAdmin);
   await page.goto(adminBase+"/signin");
   await expect(page.getByRole("link",{name:"Web address"}))
     .toHaveAttribute("href",adminBase+"/subdomain");
   await page.goto(adminBase+"/subdomain");
   await expect(page.getByRole("link",{name:"Sign-in methods"}))
     .toHaveAttribute("href",adminBase+"/signin");

   await page.goto(targetAdmin+"/history?page=bad");
   await expect(page.getByText("Invalid history page")).toBeVisible();
   await page.goto("/admin/course-progress/students?page=bad");
   await expect(page.getByText("Invalid progress filters")).toBeVisible();
  });
 }
 test("Learner cannot inspect Super Admin sessions, sign-in settings or activity history",
  async({page,context})=>{
   await authenticateGracefulRole(context,"learner");
   for(const href of [targetAdmin,targetAdmin+"/history",adminBase+"/signin",adminBase+"/subdomain"]){
    await page.goto(href);
    await expect(page.getByRole("heading",{name:"Access denied",level:1})).toBeVisible();
    await expect(page.getByRole("link",{name:"Active sessions"})).toHaveCount(0);
    await expect(page.getByRole("link",{name:"Sign-in methods"})).toHaveCount(0);
   }
  });
});
