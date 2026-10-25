import {expect,test,type BrowserContext} from "@playwright/test";
import {E2E_IDENTITY_COOKIE_NAME,E2E_SECRET_COOKIE_NAME} from "../../src/auth/e2e-identity";
import {SEED_IDS} from "../../scripts/db-seed-data";

const secret=process.env.E2E_AUTH_SECRET;
test.skip(!secret,"Faculty Students browser requires E2E_AUTH_SECRET");

async function login(context:BrowserContext){
  await context.addCookies([
  {name:"lms_role",value:"FACULTY",url:"http://localhost:3000",httpOnly:true,sameSite:"Lax"},
    {name:E2E_IDENTITY_COOKIE_NAME,value:"seed-shared-faculty",url:"http://localhost:3000",httpOnly:true,sameSite:"Lax"},
    {name:E2E_SECRET_COOKIE_NAME,value:secret!,url:"http://localhost:3000",httpOnly:true,sameSite:"Lax"},
    {name:"lms_membership",value:SEED_IDS.facultyCollegeAMembership,url:"http://localhost:3000",httpOnly:true,sameSite:"Lax"},
  ]);
}

for(const viewport of [{name:"desktop",width:1280,height:800},{name:"mobile",width:390,height:844}]){
  test("Faculty Students Contacts "+viewport.name+" private-safe list and drill-in",async({page,context})=>{
    await login(context);
    await page.setViewportSize({width:viewport.width,height:viewport.height});
    const errors:string[]=[];
    page.on("pageerror",error=>errors.push(error.message));
    await page.goto("/teacher/contacts/students");
    await expect(page.getByRole("heading",{level:1,name:"Contacts"})).toBeVisible();
    await expect(page.getByRole("heading",{level:2,name:"Students"})).toBeVisible();
    await expect(page.getByRole("navigation",{name:"Contact types"}).getByRole("link",{name:"Students"})).toHaveAttribute("aria-current","page");
    const student=page.locator("article").filter({
      has:page.locator('a[href$="/'+SEED_IDS.learnerCollegeAMembership+'"]'),
    });
    await expect(student).toBeVisible();
    await expect(student.getByRole("list",{name:"Current college roles"})).toContainText("Student");
    await expect(student).not.toContainText("learner.seed@example.com");
    await expect(student).not.toContainText(/(?:\+91)?[6-9]\d{9}/);
    await expect(page.locator('a[href$="/'+SEED_IDS.facultyCollegeAMembership+'"]')).toHaveCount(0);
    await expect(page.locator('a[href$="/'+SEED_IDS.facultyCollegeBMembership+'"]')).toHaveCount(0);
    await student.getByRole("link").click();
    await expect(page).toHaveURL(new RegExp("/teacher/contacts/students/"+SEED_IDS.learnerCollegeAMembership+"$"));
    await expect(page.getByRole("heading",{level:2,name:"Public department"})).toBeVisible();
    await expect(page.getByRole("heading",{level:2,name:"Current college roles"})).toBeVisible();
    await expect(page.getByText("Student",{exact:true})).toBeVisible();
    await expect(page.getByText("Private contact details", {exact:false})).toBeVisible();
    await page.getByRole("link",{name:"Back to Contacts"}).click();
    await expect(page).toHaveURL(/\/teacher\/contacts\/students$/);
    await page.getByLabel("Search contacts").fill("learner.seed@example.com");
    await page.getByLabel("Contacts per page").selectOption("20");
    await page.getByRole("button",{name:"Search",exact:true}).click();
    await expect(page.getByText("No public directory members found")).toBeVisible();
    await page.getByRole("link",{name:"Clear search"}).click();
    await expect(student).toBeVisible();
    if(viewport.name==="mobile"){
      const width=await page.evaluate(()=>document.documentElement.scrollWidth);
      expect(width).toBeLessThanOrEqual(viewport.width+1);
    }
    expect(errors).toEqual([]);
  });
}
