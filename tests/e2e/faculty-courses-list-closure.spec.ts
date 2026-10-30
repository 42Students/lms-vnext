import {expect,test} from "@playwright/test";
import {E2E_IDENTITY_COOKIE_NAME,E2E_SECRET_COOKIE_NAME} from "../../src/auth/e2e-identity";
import {SEED_IDS} from "../../scripts/db-seed-data";

const BASE="http://localhost:3000";
const secret=process.env.E2E_AUTH_SECRET;
test.skip(!secret || !process.env.E2E_DATABASE_URL || process.env.E2E_AUTH_ENABLED!=="true",
 "Faculty list acceptance needs disposable E2E database and authorized test cookies");

for(const view of [
 {name:"desktop",width:1280,height:800},
 {name:"mobile",width:390,height:844},
]){
 test("Faculty Courses list "+view.name+" shows assigned Sections and recoverable search",async({page,context})=>{
  test.setTimeout(100_000);
  await page.setViewportSize({width:view.width,height:view.height});
  await context.addCookies([
   {name:"lms_role",value:"FACULTY",url:BASE,httpOnly:true,sameSite:"Lax"},
   {name:E2E_IDENTITY_COOKIE_NAME,value:"seed-shared-faculty",url:BASE,httpOnly:true,sameSite:"Lax"},
   {name:E2E_SECRET_COOKIE_NAME,value:secret!,url:BASE,httpOnly:true,sameSite:"Lax"},
   {name:"lms_membership",value:SEED_IDS.facultyCollegeAMembership,url:BASE,httpOnly:true,sameSite:"Lax"},
  ]);
  const errors:string[]=[];
  page.on("pageerror",error=>errors.push(error.message));
  await page.goto("/teacher/courses");
  const table=page.getByRole("region",{name:"Courses in the new Faculty prototype"});
  await expect(page.getByRole("heading",{level:1,name:"Courses"})).toBeVisible();
  await expect(table).toBeVisible();
  await expect(table.getByLabel("Academic period")).toHaveValue("all");
  const course=table.getByRole("row").filter({hasText:"E2E Browser Course"}).first();
  await expect(course).toContainText("E2E Section A");
  await expect(page.getByText("E2E Section B Secret",{exact:true})).toHaveCount(0);
  const search=table.getByRole("searchbox",{name:"Search courses"});
  await search.fill("definitely-not-a-faculty-course-zzzz");
  await expect(table.getByText("No courses match your search")).toBeVisible();
  await search.fill("E2E Browser Course");
  await expect(course).toBeVisible();
  await course.getByRole("link",{name:"Open",exact:true}).click();
  await expect(page).toHaveURL(/\/teacher\/courses\/[^/]+\/home$/);
  await expect(page.getByText("E2E Section B Secret",{exact:true})).toHaveCount(0);
  await page.goto("/teacher/courses?collegeId="+SEED_IDS.collegeB);
  await expect(page.getByText("The Course filters could not be understood.")).toBeVisible();
  await expect(page.getByRole("region",{name:"Courses in the new Faculty prototype"})).toHaveCount(0);
  await page.getByRole("link",{name:"Reset filters"}).click();
  await expect(table).toBeVisible();
  if(view.name==="mobile"){
   const width=await page.evaluate(()=>document.documentElement.scrollWidth);
   expect(width).toBeLessThanOrEqual(view.width+1);
  }
  expect(errors).toEqual([]);
 });
}
