import {test,expect} from "@playwright/test";
import {E2E_IDENTITY_COOKIE_NAME,E2E_SECRET_COOKIE_NAME} from "../../src/auth/e2e-identity";
import {SEED_IDS} from "../../scripts/db-seed-data";
const BASE="http://localhost:3000";
const secret=process.env.E2E_AUTH_SECRET;
test.skip(!secret||!process.env.E2E_DATABASE_URL||process.env.E2E_AUTH_ENABLED!=="true",
 "Faculty chooser browser acceptance requires authorized disposable E2E session");
for(const device of [{name:"desktop",width:1280,height:800},{name:"mobile",width:390,height:844}]){
 test("Faculty "+device.name+" keeps active Section through five course tabs and denies cross-college navigation",async({page,context})=>{
  test.setTimeout(120_000);
  await page.setViewportSize({width:device.width,height:device.height});
  await context.addCookies([
   {name:"lms_role",value:"FACULTY",url:BASE,httpOnly:true,sameSite:"Lax"},
   {name:E2E_IDENTITY_COOKIE_NAME,value:"seed-shared-faculty",url:BASE,httpOnly:true,sameSite:"Lax"},
   {name:E2E_SECRET_COOKIE_NAME,value:secret!,url:BASE,httpOnly:true,sameSite:"Lax"},
   {name:"lms_membership",value:SEED_IDS.facultyCollegeAMembership,url:BASE,httpOnly:true,sameSite:"Lax"},
  ]);
  const errors:string[]=[];
  page.on("pageerror",e=>errors.push(e.message));
  await page.goto("/teacher/courses");
  const course=page.getByRole("region",{name:"Courses in the new Faculty prototype"})
   .getByRole("row").filter({hasText:"E2E Browser Course"}).first();
  await expect(course).toBeVisible();
  await course.getByRole("link",{name:"Open",exact:true}).click();
  const chosen=page.url().match(/\/teacher\/courses\/([^/]+)\/home$/)?.[1];
  expect(chosen).toBeTruthy();
  const tabs=page.getByRole("navigation",{name:"Faculty course tabs"});
  for(const [name,slug] of [
   ["Overview","home"],["Blueprint","blueprint"],
   ["Students","students"],["Attendance","attendanceDetail"],["Discussions","discussions"],
  ]){
   await tabs.getByRole("link",{name}).click();
   await expect(page).toHaveURL(new RegExp("/teacher/courses/"+chosen+"/"+slug+"$"));
   await expect(page.getByText("E2E Section B Secret",{exact:true})).toHaveCount(0);
  }
  await page.goto("/teacher/courses/"+SEED_IDS.collegeB+"/home");
  await expect(page.getByRole("navigation",{name:"Faculty course tabs"})).toHaveCount(0);
  if(device.name==="mobile")
   expect(await page.evaluate(()=>document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(device.width+1);
  expect(errors).toEqual([]);
 });
}
