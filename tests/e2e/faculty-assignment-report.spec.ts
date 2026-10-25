import {randomUUID} from "node:crypto";
import {readFile} from "node:fs/promises";
import {expect,test,type BrowserContext} from "@playwright/test";
import {E2E_IDENTITY_COOKIE_NAME,E2E_SECRET_COOKIE_NAME} from "../../src/auth/e2e-identity";
import {SEED_IDS} from "../../scripts/db-seed-data";
const secret=process.env.E2E_AUTH_SECRET;
test.skip(!secret,"Assignment Report acceptance requires isolated E2E auth");

async function login(context:BrowserContext){
 await context.addCookies([
  {name:"lms_role",value:"FACULTY",url:"http://localhost:3000",httpOnly:true,sameSite:"Lax"},
  {name:E2E_IDENTITY_COOKIE_NAME,value:"seed-shared-faculty",
   url:"http://localhost:3000",httpOnly:true,sameSite:"Lax"},
  {name:E2E_SECRET_COOKIE_NAME,value:secret!,
   url:"http://localhost:3000",httpOnly:true,sameSite:"Lax"},
  {name:"lms_membership",value:SEED_IDS.facultyCollegeAMembership,
   url:"http://localhost:3000",httpOnly:true,sameSite:"Lax"},
 ]);
}
for(const view of [{name:"desktop",width:1280,height:800},{name:"mobile",width:390,height:844}]){
 test("Faculty Assignment Report "+view.name+" persisted Section and safe CSV download",async({page,context})=>{
  test.setTimeout(90_000);
  await login(context);
  await page.setViewportSize({width:view.width,height:view.height});
  const errors:string[]=[];
  page.on("pageerror",e=>errors.push(e.message));
  await page.goto("/teacher/allAssignments");
  await page.getByRole("button",{name:"+ Create Assignment"}).click();
  const dialog=page.getByRole("dialog",{name:"Create Assignment"});
  const title="Faculty report proof "+randomUUID().slice(0,9);
  await dialog.getByLabel("Title",{exact:true}).fill(title);
  const saving=page.waitForResponse(res=>
   res.request().method()==="POST" &&
   new URL(res.url()).pathname==="/api/courses/assignments");
  await dialog.getByRole("button",{name:"Create draft"}).click();
  const response=await saving;
  expect(response.status()).toBe(201);
  const body=await response.json();
  const id:string=body.assignment.id;
  const deliveryId:string=body.assignment.deliveryId;
  expect(id).toMatch(/^[0-9a-f-]{36}$/i);
  expect(deliveryId).toMatch(/^[0-9a-f-]{36}$/i);
  await page.goto("/teacher/report/assignment/"+id+"?deliveryId="+deliveryId);
  await expect(page.getByRole("heading",{level:1,name:title})).toBeVisible();
  await expect(page.getByRole("heading",{name:"Score distribution"})).toBeVisible();
  await expect(page.getByRole("heading",{name:"Submission timing"})).toBeVisible();
  await expect(page.getByRole("link",{name:"Filter submissions and export"})).toBeVisible();
  await expect(page.getByRole("link",{name:"Download CSV"})).toBeVisible();
  const csvLink=page.getByRole("link",{name:"Download CSV"});
  await expect(csvLink).toHaveAttribute("href",new RegExp("/api/courses/faculty/reports/assignment/"+id+"/csv"));
  const pending=page.waitForEvent("download");
  await csvLink.click();
  const download=await pending;
  expect(download.suggestedFilename().startsWith("faculty-assignment-report-")).toBe(true);
  const csv=await readFile((await download.path())!,"utf8");
  expect(csv).toContain('"Learner","Response","Score","Percent","Submitted at (IST)","Details"');
  expect(csv).not.toContain("learner.seed@example.com");
  expect(csv).not.toContain("@example.");
  const denied=await page.evaluate(async args=>{
   const url="/api/courses/faculty/reports/assignment/"+args.id+
    "/csv?deliveryId="+args.forged;
   return (await fetch(url)).status;
  },{id,forged:SEED_IDS.collegeB});
  expect(denied).toBeGreaterThanOrEqual(400);
  if(view.name==="mobile"){
   const width=await page.evaluate(()=>document.documentElement.scrollWidth);
   expect(width).toBeLessThanOrEqual(view.width+1);
  }
  expect(errors).toEqual([]);
 });
}
