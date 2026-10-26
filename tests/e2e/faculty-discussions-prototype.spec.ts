import {expect,test,type BrowserContext} from "@playwright/test";
import {E2E_IDENTITY_COOKIE_NAME,E2E_SECRET_COOKIE_NAME} from "../../src/auth/e2e-identity";
import {SEED_IDS} from "../../scripts/db-seed-data";
const secret=process.env.E2E_AUTH_SECRET;
test.skip(!secret||process.env.E2E_AUTH_ENABLED!=="true",
 "Faculty Discussions prototype requires authorized disposable E2E identity");
async function login(context:BrowserContext){
 await context.addCookies([
  {name:"lms_role",value:"FACULTY",url:"http://localhost:3000",httpOnly:true,sameSite:"Lax"},
  {name:E2E_IDENTITY_COOKIE_NAME,value:"seed-shared-faculty",url:"http://localhost:3000",httpOnly:true,sameSite:"Lax"},
  {name:E2E_SECRET_COOKIE_NAME,value:secret!,url:"http://localhost:3000",httpOnly:true,sameSite:"Lax"},
  {name:"lms_membership",value:SEED_IDS.facultyCollegeAMembership,url:"http://localhost:3000",httpOnly:true,sameSite:"Lax"},
 ]);
}
test("Faculty Discussions screenshot 08 uses flat pinned-first list, real moderation and inline composer",
 async({page,context})=>{
 test.setTimeout(120000);
 await login(context);
 await page.setViewportSize({width:1440,height:900});
 const errors:string[]=[];
 page.on("pageerror",error=>errors.push(error.message));
 await page.goto("/teacher/courses");
 await page.getByRole("region",{name:"Courses in the new Faculty prototype"})
  .getByRole("row").filter({hasText:"E2E Browser Course"}).first()
  .getByRole("link",{name:"Open",exact:true}).click();
 await expect(page).toHaveURL(/\/teacher\/courses\/[0-9a-f-]{36}\/home$/i);
 await page.getByRole("navigation",{name:"Faculty course tabs"})
  .getByRole("link",{name:"Discussions"}).click();
 const pane=page.locator(".faculty-prototype-discussion");
 await expect(pane.getByRole("heading",{name:/^Course discussions · /})).toBeVisible();
 const composer=pane.getByRole("textbox",{name:"Write a message"});
 await expect(composer).toBeVisible();
 await expect(composer).toHaveAttribute("rows","1");
 const message="Faculty prototype discuss "+Date.now();
 await composer.fill(message);
 const posted=page.waitForResponse(r=>r.request().method()==="POST"&&
   new URL(r.url()).pathname.endsWith("/discussions"));
 await pane.getByRole("button",{name:"Send",exact:true}).click();
 expect((await posted).status()).toBe(201);
 const row=pane.getByRole("article").filter({hasText:message});
 await expect(row).toBeVisible();
 await expect(row.getByRole("button",{name:/^Pin /})).toBeVisible();
 await expect(row.getByRole("button",{name:/^Delete /})).toBeVisible();
 const pinned=page.waitForResponse(r=>r.request().method()==="PATCH"&&
   new URL(r.url()).pathname.includes("/discussions/"));
 await row.getByRole("button",{name:/^Pin /}).click();
 expect((await pinned).ok()).toBe(true);
 await expect(row.getByText("Pinned",{exact:true})).toBeVisible();
 await page.setViewportSize({width:390,height:844});
 await expect(composer).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(391);
 const unpinned=page.waitForResponse(r=>r.request().method()==="PATCH"&&
   new URL(r.url()).pathname.includes("/discussions/"));
 await row.getByRole("button",{name:/^Unpin /}).click();
 expect((await unpinned).ok()).toBe(true);
 await row.getByRole("button",{name:/^Delete /}).click();
 const confirmation=page.getByRole("dialog",{name:"Delete this message?"});
 await expect(confirmation).toBeVisible();
 const removed=page.waitForResponse(r=>r.request().method()==="DELETE"&&
   new URL(r.url()).pathname.includes("/discussions/"));
 await confirmation.getByRole("button",{name:"Delete",exact:true}).click();
 expect((await removed).ok()).toBe(true);
 await expect(row).toHaveCount(0);
 expect(errors).toEqual([]);
});
