import {expect,test,type BrowserContext} from "@playwright/test";
import {readFile} from "node:fs/promises";
import {E2E_IDENTITY_COOKIE_NAME,E2E_SECRET_COOKIE_NAME} from "../../src/auth/e2e-identity";
import {SEED_IDS} from "../../scripts/db-seed-data";

const secret=process.env.E2E_AUTH_SECRET;
test.skip(!secret,"Faculty Course Students browser requires E2E_AUTH_SECRET");
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
 test("Faculty Course Students "+view.name+" exact delivery roster, details and private-safe CSV",async({page,context})=>{
  await login(context);
  await page.setViewportSize({width:view.width,height:view.height});
  const errors:string[]=[];
  page.on("pageerror",e=>errors.push(e.message));
  await page.goto("/teacher/courses");
  await page.getByRole("link",{name:/E2E Browser Course/}).click();
  await page.getByRole("navigation",{name:"Faculty course tabs"})
    .getByRole("link",{name:"Students"}).click();
  await expect(page).toHaveURL(/\/students$/,{timeout:20000});
  await expect(page.getByRole("region",{name:"Faculty prototype students"})).toBeVisible();
  await page.getByLabel("Search students").fill("no-student-faculty-zzzzz");
  await expect(page.getByText("No students match your search.")).toBeVisible();
  await page.getByLabel("Search students").fill("learner.seed@example.com");
  const detailLink=page.getByRole("region",{name:"Faculty prototype students"}).getByRole("row").getByRole("link").first();
  await expect(detailLink).toBeVisible();
  await expect(page.getByText("E2E Section B Secret")).toHaveCount(0);
  const downloadStarted=page.waitForEvent("download");
  await page.getByRole("button",{name:"Download roster CSV"}).click();
  const download=await downloadStarted;
  const csv=await readFile((await download.path())!,"utf8");
  expect(download.suggestedFilename()).toMatch(/^faculty-roster-.*\.csv$/);
  expect(csv).toContain("Student,Roll number");
  expect(csv).not.toContain("learner.seed@example.com");
  expect(csv).not.toContain("Email,Phone");
  expect(csv).not.toContain("E2E Section B Secret");
  await detailLink.click();
  await expect(page).toHaveURL(/\/students\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("region",{name:"Student Details"})).toBeVisible();
  await expect(page.getByRole("heading",{name:"Course attendance"})).toBeVisible();
  await expect(page.getByRole("heading",{name:"Session history"})).toBeVisible();
  await expect(page.getByText("Unknown",{exact:true})).toBeVisible();
  await page.getByRole("link",{name:"← Students"}).click();
  await expect(page).toHaveURL(/\/students$/);
  if(view.name==="mobile"){
   const width=await page.evaluate(()=>document.documentElement.scrollWidth);
   expect(width).toBeLessThanOrEqual(view.width+1);
  }
  expect(errors).toEqual([]);
 });
}
