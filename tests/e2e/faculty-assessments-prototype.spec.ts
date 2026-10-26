import {expect,test,type BrowserContext} from "@playwright/test";
import {E2E_IDENTITY_COOKIE_NAME,E2E_SECRET_COOKIE_NAME} from "../../src/auth/e2e-identity";
import {SEED_IDS} from "../../scripts/db-seed-data";
const secret=process.env.E2E_AUTH_SECRET;
test.skip(!secret||process.env.E2E_AUTH_ENABLED!=="true",
 "Faculty unified assessments screenshot acceptance requires isolated identity");
async function login(context:BrowserContext){
 await context.addCookies([
  {name:"lms_role",value:"FACULTY",url:"http://localhost:3000",httpOnly:true,sameSite:"Lax"},
  {name:E2E_IDENTITY_COOKIE_NAME,value:"seed-shared-faculty",url:"http://localhost:3000",httpOnly:true,sameSite:"Lax"},
  {name:E2E_SECRET_COOKIE_NAME,value:secret!,url:"http://localhost:3000",httpOnly:true,sameSite:"Lax"},
  {name:"lms_membership",value:SEED_IDS.facultyCollegeAMembership,url:"http://localhost:3000",httpOnly:true,sameSite:"Lax"},
 ]);
}
test("Faculty unified Assignments and quizzes screenshot 09 filters real rows and opens both create builders",
 async({page,context})=>{
 test.setTimeout(120000);
 await login(context);
 await page.setViewportSize({width:1440,height:900});
 const errors:string[]=[];
 page.on("pageerror",error=>errors.push(error.message));
 await page.goto("/teacher/assessments");
 await expect(page.getByRole("heading",{level:1,name:"Assignments & quizzes"})).toBeVisible();
 await expect(page.getByText("One list instead of two pages.")).toBeVisible();
 const course=page.getByRole("combobox",{name:"Filter by course"});
 await expect(course).toBeVisible();
 // Course codes can repeat across different Section deliveries: filtering
 // must preserve the exact authorized Section rather than combine both.
 const sectionOptions=course.locator("option:not([value='all'])");
 if(await sectionOptions.count()){
  const value=await sectionOptions.first().getAttribute("value");
  expect(value).toMatch(/^[0-9a-f-]{36}$/i);
  await course.selectOption(value!);
  await expect(course).toHaveValue(value!);
  await course.selectOption("all");
 }
 const tabs=page.getByRole("navigation",{name:"Assessment type"});
 const all=tabs.getByRole("button",{name:/^All \d+$/});
 const assignments=tabs.getByRole("button",{name:/^Assignments \d+$/});
 const quizzes=tabs.getByRole("button",{name:/^Quizzes \d+$/});
 await expect(all).toHaveAttribute("aria-pressed","true");
 await assignments.click();
 await expect(assignments).toHaveAttribute("aria-pressed","true");
 await quizzes.click();
 await expect(quizzes).toHaveAttribute("aria-pressed","true");
 await all.click();
 await expect(page).toHaveURL(/\/teacher\/assessments(?:\?.*)?$/);
 // Canonical shareable filters are the first no-feature-loss step towards
 // consolidating the old standalone lists into this combined directory.
 await page.goto("/teacher/assessments?kind=assignment");
 await expect(assignments).toHaveAttribute("aria-pressed","true");
 await quizzes.click();
 await expect(page).toHaveURL(/\/teacher\/assessments\?kind=quiz$/);
 await page.reload();
 await expect(quizzes).toHaveAttribute("aria-pressed","true");
 await all.click();
 await expect(page).toHaveURL(/\/teacher\/assessments$/);
 await page.goto("/teacher/assessments?kind=unsupported");
 await expect(all).toHaveAttribute("aria-pressed","true");
 const table=page.getByRole("table");
 for(const label of ["Title","Course · Class","Due","Handed in","Status"])
  await expect(table.getByRole("columnheader",{name:label})).toBeVisible();
 await page.getByRole("button",{name:"+ Quiz",exact:true}).click();
 await expect(page.getByRole("dialog",{name:"Create Quiz"})).toBeVisible();
 await page.getByRole("dialog",{name:"Create Quiz"}).getByRole("button",{name:"Cancel"}).click();
 await expect(page.getByRole("dialog",{name:"Create Quiz"})).toHaveCount(0);
 await page.getByRole("button",{name:"+ Assignment",exact:true}).click();
 await expect(page.getByRole("dialog",{name:"Create New Assignment"})).toBeVisible();
 await page.getByRole("dialog",{name:"Create New Assignment"}).getByRole("button",{name:"Cancel"}).click();
 await expect(page.getByRole("dialog",{name:"Create New Assignment"})).toHaveCount(0);
 await page.setViewportSize({width:390,height:844});
 await expect(tabs).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(391);
 expect(errors).toEqual([]);
});
