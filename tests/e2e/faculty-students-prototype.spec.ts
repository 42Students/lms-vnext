import {expect,test,type BrowserContext} from "@playwright/test";
import {E2E_IDENTITY_COOKIE_NAME,E2E_SECRET_COOKIE_NAME} from "../../src/auth/e2e-identity";
import {SEED_IDS} from "../../scripts/db-seed-data";

const secret=process.env.E2E_AUTH_SECRET;
test.skip(!secret||process.env.E2E_AUTH_ENABLED!=="true","Faculty Students prototype requires isolated authenticated E2E");

async function login(context:BrowserContext){
 await context.addCookies([
  {name:"lms_role",value:"FACULTY",url:"http://localhost:3000",httpOnly:true,sameSite:"Lax"},
  {name:E2E_IDENTITY_COOKIE_NAME,value:"seed-shared-faculty",url:"http://localhost:3000",httpOnly:true,sameSite:"Lax"},
  {name:E2E_SECRET_COOKIE_NAME,value:secret!,url:"http://localhost:3000",httpOnly:true,sameSite:"Lax"},
  {name:"lms_membership",value:SEED_IDS.facultyCollegeAMembership,url:"http://localhost:3000",httpOnly:true,sameSite:"Lax"},
 ]);
}

test("Faculty Students prototype #06 has four cards, scoped contacts, search, behind filter and accessible export",async({page,context})=>{
 test.setTimeout(90000);
 await login(context);
 await page.setViewportSize({width:1440,height:900});
 const errors:string[]=[];
 page.on("pageerror",error=>errors.push(error.message));
 await page.goto("/teacher/courses");
 await page.getByRole("region",{name:"Courses in the new Faculty prototype"})
  .getByRole("row").filter({hasText:"E2E Browser Course"}).first()
  .getByRole("link",{name:"Open",exact:true}).click();
 await page.getByRole("navigation",{name:"Faculty course tabs"})
  .getByRole("link",{name:"Students"}).click();
 const dir=page.getByRole("region",{name:"Faculty prototype students"});
 await expect(dir).toBeVisible();
 for(const heading of ["Students","Behind on the course","Attendance under 75%"])
  await expect(dir.getByText(heading,{exact:true}).first()).toBeVisible();
 await expect(dir.getByText(/Not submitted (latest assignment|.+)/).first()).toBeVisible();
 const table=dir.getByRole("table");
 for(const label of ["Student","Roll no","Progress","Attendance","Assignments","Contact"])
  await expect(table.getByRole("columnheader",{name:label})).toBeVisible();
 const filter=dir.getByRole("group",{name:"Roster filter"});
 await expect(filter.getByRole("button",{name:/^All \d+$/})).toHaveAttribute("aria-pressed","true");
 const allRows=await table.getByRole("row").count();
 const behind=filter.getByRole("button",{name:/^Behind (\d+|—)$/});
 if(await behind.isEnabled()){
  await behind.click();
  await expect(behind).toHaveAttribute("aria-pressed","true");
  expect(await table.getByRole("row").count()).toBeLessThanOrEqual(allRows);
  await filter.getByRole("button",{name:/^All \d+$/}).click();
 }else{
  await expect(behind).toContainText("—");
  await expect(behind).toHaveAttribute("aria-pressed","false");
 }
 const search=dir.getByRole("searchbox",{name:"Search students"});
 await search.fill("no-such-learner-prototype");
 await expect(dir.getByText("No students match your search.")).toBeVisible();
 await search.fill("");
 await expect(dir.getByRole("button",{name:"Download roster CSV"})).toBeVisible();
 await page.setViewportSize({width:390,height:844});
 await expect(dir.getByRole("table")).toBeAttached();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(391);
 expect(errors).toEqual([]);
});
