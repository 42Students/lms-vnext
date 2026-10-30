import {expect,test,type BrowserContext} from "@playwright/test";
import {E2E_IDENTITY_COOKIE_NAME,E2E_SECRET_COOKIE_NAME} from "../../src/auth/e2e-identity";
import {SEED_IDS} from "../../scripts/db-seed-data";
const secret=process.env.E2E_AUTH_SECRET;
test.skip(!secret,"Faculty Contacts acceptance needs E2E_AUTH_SECRET");
async function login(context:BrowserContext){
 await context.addCookies([
  {name:"lms_role",value:"FACULTY",url:"http://localhost:3000",httpOnly:true,sameSite:"Lax"},
  {name:E2E_IDENTITY_COOKIE_NAME,value:"seed-shared-faculty",url:"http://localhost:3000",httpOnly:true,sameSite:"Lax"},
  {name:E2E_SECRET_COOKIE_NAME,value:secret!,url:"http://localhost:3000",httpOnly:true,sameSite:"Lax"},
  {name:"lms_membership",value:SEED_IDS.facultyCollegeAMembership,url:"http://localhost:3000",httpOnly:true,sameSite:"Lax"},
 ]);
}
for(const view of [{name:"desktop",width:1280,height:800},{name:"mobile",width:390,height:844}]){
 test("Faculty All Contacts "+view.name+" role scope, masked details and search",async({page,context})=>{
  await login(context);
  await page.setViewportSize({width:view.width,height:view.height});
  const errors:string[]=[];
  page.on("pageerror",e=>errors.push(e.message));
  await page.goto("/teacher/contacts/allContacts?pageSize=50");
  await expect(page.getByRole("heading",{level:1,name:"All Contacts"})).toBeVisible();
  await expect(page.getByRole("heading",{level:2,name:"Directory results"})).toBeVisible();
  const tabs=page.getByRole("navigation",{name:"Contacts sections"});
  await expect(tabs.getByRole("link",{name:"All Contacts"})).toHaveAttribute("aria-current","page");
  await expect(tabs.getByRole("link",{name:"Teachers"})).toBeVisible();
  await expect(tabs.getByRole("link",{name:"Students"})).toBeVisible();
  const link=page.locator('a[href*="/'+SEED_IDS.learnerCollegeAMembership+'"]:visible').first();
  await expect(link).toBeVisible();
  const row=page.locator(view.name==="mobile"?"article":"tr").filter({has:link});
  await expect(row).toBeVisible();
  await expect(row.getByRole("list",{name:"Current college roles"})).toContainText("Student");
  await expect(row).not.toContainText("@");
  await expect(row).not.toContainText(/(?:\+91)?[6-9]\d{9}/);
  await expect(page.locator('a[href*="/'+SEED_IDS.facultyCollegeBMembership+'"]')).toHaveCount(0);
  await expect(page.locator('a[href*="/'+SEED_IDS.facultyCollegeAMembership+'"]:visible')).toHaveCount(1);
  await link.click();
  await expect(page).toHaveURL(/\/teacher\/contacts\/allContacts\/[0-9a-f-]{36}(?:\?.*)?$/i,{timeout:20000});
  await expect(page.getByRole("heading",{level:2,name:"Public department"})).toBeVisible();
  await expect(page.getByRole("heading",{level:2,name:"Current college roles"})).toBeVisible();
  await expect(page.getByText("Student",{exact:true})).toBeVisible();
  await page.getByRole("link",{name:"Back to Contacts"}).click();
  await expect(page).toHaveURL(/\/teacher\/contacts\/allContacts(?:\?.*)?$/,{timeout:20000});
  await page.getByRole("searchbox",{name:"Search contacts"}).fill("private-email-not-public@example.invalid");
  await expect(page.getByText(/No contacts match/)).toBeVisible({timeout:20000});
  await expect(page).toHaveURL(/q=private-email-not-public%40example\.invalid/);
  // Switching roles must preserve the public search and the 10/20/50 row-size choice.
  await tabs.getByRole("link",{name:"Students"}).click();
  await expect(page).toHaveURL(/\/teacher\/contacts\/students\?.*q=private-email-not-public/);
  await expect(page.getByRole("searchbox",{name:"Search contacts"})).toHaveValue("private-email-not-public@example.invalid");
  await page.getByRole("navigation",{name:"Contacts sections"}).getByRole("link",{name:"All Contacts"}).click();
  await expect(page.getByRole("searchbox",{name:"Search contacts"})).toHaveValue("private-email-not-public@example.invalid");
  await page.getByRole("button",{name:"Clear search"}).click();
  await expect(page.getByRole("searchbox",{name:"Search contacts"})).toHaveValue("");
  await expect(page.locator('a[href*="/'+SEED_IDS.learnerCollegeAMembership+'"]:visible').first()).toBeVisible({timeout:20000});
  await expect(page).toHaveURL(/\/teacher\/contacts\/allContacts\?pageSize=50$/,{timeout:20000});
  // A real Back navigation must discard unsaved search text and restore URL state,
  // rather than firing a late replace() with stale draft content.
  await page.evaluate(()=>{
   window.history.pushState({},"","/teacher/contacts/allContacts?q=temporary&pageSize=50");
  });
  await page.getByRole("searchbox",{name:"Search contacts"}).fill("draft-search-not-committed");
  await page.goBack();
  await expect(page).toHaveURL(/\/teacher\/contacts\/allContacts\?pageSize=50$/);
  await expect(page.getByRole("searchbox",{name:"Search contacts"})).toHaveValue("");
  if(view.name==="mobile"){
   const width=await page.evaluate(()=>document.documentElement.scrollWidth);
   expect(width).toBeLessThanOrEqual(view.width+1);
  }
  expect(errors).toEqual([]);
 });
}
