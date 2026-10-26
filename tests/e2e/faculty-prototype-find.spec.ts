import {expect,test,type BrowserContext} from "@playwright/test";
import {E2E_IDENTITY_COOKIE_NAME,E2E_SECRET_COOKIE_NAME} from "../../src/auth/e2e-identity";
import {SEED_IDS} from "../../scripts/db-seed-data";

const secret=process.env.E2E_AUTH_SECRET;
test.skip(!secret||process.env.E2E_AUTH_ENABLED!=="true",
  "Faculty prototype header requires isolated E2E auth");

async function login(context:BrowserContext){
 await context.addCookies([
  {name:"lms_role",value:"FACULTY",url:"http://localhost:3000",httpOnly:true,sameSite:"Lax"},
  {name:E2E_IDENTITY_COOKIE_NAME,value:"seed-shared-faculty",url:"http://localhost:3000",httpOnly:true,sameSite:"Lax"},
  {name:E2E_SECRET_COOKIE_NAME,value:secret!,url:"http://localhost:3000",httpOnly:true,sameSite:"Lax"},
  {name:"lms_membership",value:SEED_IDS.facultyCollegeAMembership,url:"http://localhost:3000",httpOnly:true,sameSite:"Lax"},
 ]);
}

for(const viewport of [{name:"desktop",width:1280,height:800},{name:"mobile",width:390,height:844}]){
 test("Faculty prototype Find, bell and profile "+viewport.name,async({page,context})=>{
  test.setTimeout(90000);
  await login(context);
  await page.setViewportSize({width:viewport.width,height:viewport.height});
  const errors:string[]=[];
  page.on("pageerror",e=>errors.push(e.message));
  await page.goto("/teacher");
  const search=page.getByRole("combobox",{name:"Search workspace"});
  if(viewport.name==="mobile"){
   await page.getByRole("button",{name:"Open command search"}).click();
  }
  await search.fill("E2E Browser Course");
  const matches=page.getByRole("region",{name:"Matching Faculty records"});
  await expect(matches).toBeVisible();
  await expect(matches.getByText("Courses and pages")).toBeVisible();
  const course=matches.getByRole("option").filter({hasText:"E2E Browser Course"}).first();
  await expect(course).toBeVisible({timeout:20000});
  await course.click();
  await expect(page).toHaveURL(/\/teacher\/courses\/[0-9a-f-]{36}\/home$/i,{timeout:20000});
  await expect(page.getByRole("heading",{level:1,name:"E2E Browser Course"})).toBeVisible();
  await page.getByRole("link",{name:/^Notifications(?:,|$)/}).click();
  await expect(page).toHaveURL(/\/teacher\/notifications$/,{timeout:20000});
  await expect(page.getByRole("heading",{level:1,name:"Notifications"})).toBeVisible();
  await page.getByRole("button",{name:"Open account menu"}).click();
  const account=page.getByRole("dialog",{name:"Account menu"});
  await expect(account.getByRole("link",{name:"My Account"})).toHaveAttribute("href","/teacher/profile");
  await account.getByRole("link",{name:"My Account"}).click();
  await expect(page).toHaveURL(/\/teacher\/profile$/,{timeout:20000});
  if(viewport.name==="mobile"){
   const width=await page.evaluate(()=>document.documentElement.scrollWidth);
   expect(width).toBeLessThanOrEqual(viewport.width+1);
  }
  expect(errors).toEqual([]);
 });
}
