import {expect,test,type BrowserContext} from "@playwright/test";
import {E2E_IDENTITY_COOKIE_NAME,E2E_SECRET_COOKIE_NAME} from "../../src/auth/e2e-identity";
import {SEED_IDS} from "../../scripts/db-seed-data";

const secret=process.env.E2E_AUTH_SECRET;
test.skip(!secret,"Faculty Overview E2E requires isolated E2E credentials");

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
 test("Faculty Overview "+view.name+" shows exact assigned Section and actionable reports",async({page,context})=>{
  await login(context);
  await page.setViewportSize({width:view.width,height:view.height});
  const errors:string[]=[];
  page.on("pageerror",e=>errors.push(e.message));
  await page.goto("/teacher/courses");
  await page.getByRole("link",{name:/E2E Browser Course/}).click();
  await expect(page).toHaveURL(/\/home$/,{timeout:20000});
  await expect(page.getByRole("heading",{level:1,name:"E2E Browser Course"})).toBeVisible();
  const tabs=page.getByRole("navigation",{name:"Faculty course tabs"});
  await expect(tabs.getByRole("link",{name:"Overview"})).toHaveAttribute("aria-current","page");
  await expect(page.getByText("E2E Section A",{exact:true}).first()).toBeVisible();
  await expect(page.getByText("E2E Section B Secret")).toHaveCount(0);
  await expect(page.getByRole("region",{name:"Needs you"})).toBeVisible();
  // Screenshot #04 keeps the course-health column permanently visible.
  const summary=page.getByRole("complementary",{name:"Course summary"});
  await expect(summary).toBeVisible();
  if(view.name==="desktop"){
   const needs=await page.getByRole("region",{name:"Needs you"}).boundingBox();
   const stats=await summary.boundingBox();
   expect(needs).not.toBeNull();
   expect(stats).not.toBeNull();
   expect(stats!.x).toBeGreaterThan(needs!.x+needs!.width-2);
  }
  await expect(page.getByRole("heading",{name:"How the class is doing"})).toBeVisible();
  // The newest Faculty prototype deliberately foregrounds the priority
  // queue and course-health summary. Older diagnostics remain in Advanced.
  await expect(page.getByRole("heading",{name:"About this course"})).toBeVisible();
  await expect(page.getByText("Course progress (average)")).toBeVisible();
  await expect(page.getByRole("complementary",{name:"Course summary"}).getByText("Quiz average",{exact:true})).toBeVisible();
  await expect(page.getByText("Behind (under 30% progress)")).toBeVisible();
  await page.getByText("More course insights and teaching tools").click();
  await expect(page.getByRole("link",{name:"Current Section students"})).toBeVisible();
  const labels=["Lessons","Content","Assignments","Quizzes","Draft items"];
  for(const label of labels){
   const labelText=page.getByText(label,{exact:true});
   await expect(labelText.first()).toBeVisible();
  }
  await expect(page.getByRole("region",{name:"Pending work"})).toBeVisible();
  await expect(page.getByRole("link",{name:"Open course content"})).toBeVisible();
  await page.getByRole("link",{name:"Section reports hub"}).click();
  await expect(page).toHaveURL(/\/reports$/);
  await expect(page.getByRole("heading",{level:1,name:"Section reports"})).toBeVisible();
  await expect(page.getByText("1 current eligible learners.")).toBeVisible();
  await expect(page.getByText("No published assessment reports")).toBeVisible();
  await page.getByRole("combobox",{name:"Assessment type"}).selectOption("QUIZ");
  await page.getByRole("button",{name:"Filter",exact:true}).click();
  await expect(page).toHaveURL(/kind=QUIZ/);
  await page.getByRole("link",{name:"Clear"}).click();
  await expect(page).toHaveURL(/\/reports$/);
  await page.getByRole("link",{name:"Section workspace"}).click();
  await expect(page).toHaveURL(/\/home$/);
  if(view.name==="mobile"){
   const width=await page.evaluate(()=>document.documentElement.scrollWidth);
   expect(width).toBeLessThanOrEqual(view.width+1);
  }
  expect(errors).toEqual([]);
 });
}
