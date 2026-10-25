import {expect,test,type BrowserContext} from "@playwright/test";
import {E2E_IDENTITY_COOKIE_NAME,E2E_SECRET_COOKIE_NAME} from "../../src/auth/e2e-identity";
import {SEED_IDS} from "../../scripts/db-seed-data";

const secret=process.env.E2E_AUTH_SECRET;
test.skip(!secret,"Faculty All Contacts browser requires E2E_AUTH_SECRET");
async function login(context:BrowserContext){
 await context.addCookies([
  {name:"lms_role",value:"FACULTY",url:"http://localhost:3000",httpOnly:true,sameSite:"Lax"},
  {name:E2E_IDENTITY_COOKIE_NAME,value:"seed-shared-faculty",url:"http://localhost:3000",httpOnly:true,sameSite:"Lax"},
  {name:E2E_SECRET_COOKIE_NAME,value:secret!,url:"http://localhost:3000",httpOnly:true,sameSite:"Lax"},
  {name:"lms_membership",value:SEED_IDS.facultyCollegeAMembership,url:"http://localhost:3000",httpOnly:true,sameSite:"Lax"},
 ]);
}
for(const view of [{name:"desktop",width:1280,height:800},{name:"mobile",width:390,height:844}]){
 test("Faculty All Contacts "+view.name+" role cards, search and public drill-in",async({page,context})=>{
  await login(context);
  await page.setViewportSize({width:view.width,height:view.height});
  const errors:string[]=[];
  page.on("pageerror",e=>errors.push(e.message));
  await page.goto("/teacher/contacts/allContacts?pageSize=50");
  await expect(page.getByRole("heading",{level:1,name:"Contacts"})).toBeVisible();
  await expect(page.getByRole("heading",{level:2,name:"All Contacts"})).toBeVisible();
  const nav=page.getByRole("navigation",{name:"Contact types"});
  await expect(nav.getByRole("link",{name:"All Contacts"})).toHaveAttribute("aria-current","page");
  await expect(nav.getByRole("link",{name:"Teachers"})).toBeVisible();
  await expect(nav.getByRole("link",{name:"Students"})).toBeVisible();
  const teacher=page.locator("article").filter({has:page.locator('a[href$="/'+SEED_IDS.facultyCollegeAMembership+'"]')});
  const learner=page.locator("article").filter({has:page.locator('a[href$="/'+SEED_IDS.learnerCollegeAMembership+'"]')});
  await expect(teacher).toBeVisible();
  await expect(learner).toBeVisible();
  await expect(teacher.getByRole("list",{name:"Current college roles"})).toContainText("Faculty");
  await expect(learner.getByRole("list",{name:"Current college roles"})).toContainText("Student");
  await expect(page.locator('a[href$="/'+SEED_IDS.facultyCollegeBMembership+'"]')).toHaveCount(0);
  await expect(learner).not.toContainText("learner.seed@example.com");
  await expect(teacher).not.toContainText("@");
  await learner.getByRole("link").click();
  await expect(page).toHaveURL(new RegExp("/teacher/contacts/allContacts/"+SEED_IDS.learnerCollegeAMembership+"$"));
  await expect(page.getByRole("heading",{level:2,name:"Public department"})).toBeVisible();
  await expect(page.getByRole("heading",{level:2,name:"Current college roles"})).toBeVisible();
  await expect(page.getByText("Student",{exact:true})).toBeVisible();
  await page.getByRole("link",{name:"Back to Contacts"}).click();
  await expect(page).toHaveURL(/\/teacher\/contacts\/allContacts$/);
  await page.getByLabel("Search contacts").fill("learner.seed@example.com");
  await page.getByLabel("Contacts per page").selectOption("50");
  await page.getByRole("button",{name:"Search",exact:true}).click();
  await expect(page.getByText("No public directory members found")).toBeVisible();
  await expect(page).toHaveURL(/pageSize=50/);
  await page.getByRole("link",{name:"Clear search"}).click();
  await expect(page.getByLabel("Search contacts")).toHaveValue("");
  await page.getByLabel("Contacts per page").selectOption("50");
  await page.getByRole("button",{name:"Search",exact:true}).click();
  await expect(learner).toBeVisible();
  if(view.name==="mobile"){
   const width=await page.evaluate(()=>document.documentElement.scrollWidth);
   expect(width).toBeLessThanOrEqual(view.width+1);
  }
  expect(errors).toEqual([]);
 });
}
