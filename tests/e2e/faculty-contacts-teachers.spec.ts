import {expect,test,type BrowserContext} from "@playwright/test";
import {E2E_IDENTITY_COOKIE_NAME,E2E_SECRET_COOKIE_NAME}
 from "../../src/auth/e2e-identity";
import {SEED_IDS} from "../../scripts/db-seed-data";

const secret=process.env.E2E_AUTH_SECRET;
test.skip(!secret,"Faculty Teachers browser requires E2E_AUTH_SECRET");

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

for(const view of [{name:"desktop",width:1280,height:800},
                   {name:"mobile",width:390,height:844}]){
 test("Faculty Teachers Contacts "+view.name+" filters and public detail",async({page,context})=>{
  await login(context);
  await page.setViewportSize({width:view.width,height:view.height});
  const errors:string[]=[];
  page.on("pageerror",error=>errors.push(error.message));
  await page.goto("/teacher/contacts/teachers");
  await expect(page.getByRole("heading",{level:1,name:"Contacts"})).toBeVisible();
  await expect(page.getByRole("heading",{level:2,name:"Teachers"})).toBeVisible();
  await expect(page.getByRole("link",{name:"Teachers"})).toHaveAttribute("aria-current","page");
  const self=page.locator('article').filter({
   has:page.locator('a[href$="/'+SEED_IDS.facultyCollegeAMembership+'"]'),
  });
  await expect(self).toBeVisible();
  await expect(self.getByRole("list",{name:"Current college roles"})).toContainText("Faculty");
  await expect(page.locator('a[href$="/'+SEED_IDS.learnerCollegeAMembership+'"]'))
   .toHaveCount(0);
  await expect(page.locator('a[href$="/'+SEED_IDS.facultyCollegeBMembership+'"]'))
   .toHaveCount(0);
  await expect(page.getByRole("table")).toHaveCount(0);
  await expect(self).not.toContainText("@");
  await self.locator("a").click();
  await expect(page).toHaveURL(new RegExp(
   "/teacher/contacts/teachers/"+SEED_IDS.facultyCollegeAMembership+"$",
  ));
  await expect(page.getByRole("heading",{level:2,name:"Public department"})).toBeVisible();
  await expect(page.getByRole("heading",{level:2,name:"Current college roles"})).toBeVisible();
  await expect(page.getByText("Faculty",{exact:true})).toBeVisible();
  await page.getByRole("link",{name:"Back to Contacts"}).click();
  await expect(page).toHaveURL(/\/teacher\/contacts\/teachers$/);
  await page.getByLabel("Search contacts").fill("faculty-private-email-not-a-name@example.invalid");
  await page.getByLabel("Contacts per page").selectOption("20");
  await page.getByRole("button",{name:"Search",exact:true}).click();
  await expect(page.getByText("No public directory members found")).toBeVisible();
  await page.getByRole("link",{name:"Clear search"}).click();
  await expect(self).toBeVisible();
  if(view.name==="mobile"){
   const docWidth=await page.evaluate(()=>document.documentElement.scrollWidth);
   expect(docWidth).toBeLessThanOrEqual(view.width+1);
  }
  expect(errors).toEqual([]);
 });
}
