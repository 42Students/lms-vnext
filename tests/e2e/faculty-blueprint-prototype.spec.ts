import {expect,test,type BrowserContext} from "@playwright/test";
import {E2E_IDENTITY_COOKIE_NAME,E2E_SECRET_COOKIE_NAME} from "../../src/auth/e2e-identity";
import {SEED_IDS} from "../../scripts/db-seed-data";

const secret=process.env.E2E_AUTH_SECRET;
test.skip(!secret||process.env.E2E_AUTH_ENABLED!=="true",
 "Faculty Blueprint prototype E2E requires isolated authenticated PostgreSQL");

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

test("Faculty Blueprint screenshot 05 has a selected lesson rail, inline actions, and real authoring links",
 async({page,context})=>{
  test.setTimeout(90_000);
  await login(context);
  await page.setViewportSize({width:1440,height:900});
  const errors:string[]=[];
  page.on("pageerror",error=>errors.push(error.message));
  await page.goto("/teacher/courses");
  const courseRow=page.getByRole("region",{name:"Courses in the new Faculty prototype"})
   .getByRole("row").filter({hasText:"E2E Browser Course"}).first();
  await courseRow.getByRole("link",{name:"Open",exact:true}).click();
  const tabs=page.getByRole("navigation",{name:"Faculty course tabs"});
  await tabs.getByRole("link",{name:"Blueprint"}).click();
  const explorer=page.getByRole("region",{name:"Course blueprint lesson explorer"});
  await expect(explorer).toBeVisible();
  await expect(explorer.getByRole("heading",{name:/\d+ lessons/i})).toBeVisible();
  const lessonNav=explorer.getByRole("complementary");
  const chosen=lessonNav.getByRole("link",{current:"page"});
  await expect(chosen).toBeVisible();
  const activeLesson=chosen.getAttribute("href");
  await expect(explorer.getByRole("heading",{name:/^Lesson \d+:/})).toBeVisible();
  const order=explorer.getByRole("list",{name:"Lesson content order"});
  await expect(order).toBeVisible();
  await expect(explorer.getByRole("button",{name:"Rename"})).toBeDisabled();
  await expect(explorer.getByRole("button",{name:"+ Lesson"})).toBeDisabled();
  const edit=order.getByRole("button",{name:"Edit",exact:true}).first();
  await expect(edit).toBeVisible();
  await edit.click();
  await expect(page.getByRole("dialog",{name:/Edit (RESOURCE|VIDEO|YOUTUBE|LIVE CLASS|Assignment|Quiz)/i}))
   .toBeVisible();
  await page.getByRole("button",{name:"Close drawer"}).click();
  const remove=order.getByRole("button",{name:/^Remove /}).first();
  await expect(remove).toBeVisible();
  await remove.click();
  await expect(page.getByRole("dialog",{name:/^Remove .+\?/})).toBeVisible();
  await page.getByRole("dialog",{name:/^Remove .+\?/}).getByRole("button",{name:/Cancel/i}).click();
  await expect(page.getByRole("dialog",{name:/^Remove .+\?/})).toHaveCount(0);
  const add=explorer.locator("details").filter({has:explorer.getByText("+ Add content")}).first();
  await add.locator("summary").click();
  await expect(add.getByRole("link",{name:"Resource",exact:true})).toHaveAttribute(
   "href",new RegExp("lesson=.*advanced=1#faculty-lesson-add-"));
  await add.getByRole("link",{name:"Resource",exact:true}).click();
  await expect(page).toHaveURL(/\/blueprint\?lesson=.*advanced=1#faculty-lesson-add-/);
  await expect(page.getByText("Full blueprint editor, publishing and content ordering")).toBeVisible();
  await page.setViewportSize({width:390,height:844});
  await expect(page.getByRole("region",{name:"Course blueprint lesson explorer"})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(391);
  expect(activeLesson).not.toBeNull();
  expect(errors).toEqual([]);
 });
