import {expect,test,type BrowserContext} from "@playwright/test";
import {E2E_IDENTITY_COOKIE_NAME,E2E_SECRET_COOKIE_NAME}
 from "../../src/auth/e2e-identity";
import {SEED_IDS} from "../../scripts/db-seed-data";

const secret=process.env.E2E_AUTH_SECRET;
test.skip(!secret||process.env.E2E_AUTH_ENABLED!=="true",
 "Faculty Courses prototype acceptance requires isolated browser identity and PostgreSQL");

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

test("Faculty Courses matches prototype table, preserves search, attendance, and responsive navigation",
 async({page,context})=>{
  test.setTimeout(90_000);
  await login(context);
  const errors:string[]=[];
  page.on("pageerror",e=>errors.push(e.message));
  await page.setViewportSize({width:1440,height:900});
  await page.goto("/teacher/courses");
  const panel=page.getByRole("region",{name:"Courses in the new Faculty prototype"});
  await expect(panel.getByRole("heading",{name:"Courses",exact:true})).toBeVisible();
  const table=panel.getByRole("table");
  for(const heading of ["Course","Classes","To do","Attendance"])
   await expect(table.getByRole("columnheader",{name:heading,exact:true})).toBeVisible();
  const period=panel.getByRole("combobox",{name:"Academic period"});
  await expect(period).toBeVisible();
  const filter=panel.getByRole("group",{name:"Course type"});
  for(const label of [/^All \d+$/,/^Regular \d+$/,/^Electives \d+$/])
   await expect(filter.getByRole("button",{name:label})).toBeVisible();
  await period.selectOption("all");
  const search=panel.getByRole("searchbox",{name:"Search courses"});
  await search.fill("no-matching-course-zzzz");
  await expect(panel.getByText("No courses match your search")).toBeVisible();
  await search.fill("E2E Browser Course");
  const courseRow=table.getByRole("row").filter({hasText:"E2E Browser Course"}).first();
  await expect(courseRow).toBeVisible();
  await expect(courseRow.getByRole("cell").nth(3)).toContainText(/% this month|Not recorded/);
  await expect(courseRow.getByRole("link",{name:"Open",exact:true}))
   .toHaveAttribute("href",/\/teacher\/courses\/[0-9a-f-]{36}\/home$/i);
  await page.setViewportSize({width:390,height:844});
  await expect(panel.getByRole("heading",{name:"Courses",exact:true})).toBeVisible();
  await expect(courseRow.getByRole("cell").nth(3)).toBeAttached();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(391);
  await courseRow.getByRole("link",{name:"Open",exact:true}).click();
  await expect(page).toHaveURL(/\/teacher\/courses\/[0-9a-f-]{36}\/home$/i);
  expect(errors).toEqual([]);
 });
