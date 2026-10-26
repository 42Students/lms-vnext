import {expect,test,type BrowserContext} from "@playwright/test";
import {E2E_IDENTITY_COOKIE_NAME,E2E_SECRET_COOKIE_NAME} from "../../src/auth/e2e-identity";
import {SEED_IDS} from "../../scripts/db-seed-data";
const secret=process.env.E2E_AUTH_SECRET;
test.skip(!secret||process.env.E2E_AUTH_ENABLED!=="true",
 "Faculty screenshot 12 schedule requires a disposable seeded E2E environment");
async function login(context:BrowserContext){
 await context.addCookies([
  {name:"lms_role",value:"FACULTY",url:"http://localhost:3000",httpOnly:true,sameSite:"Lax"},
  {name:E2E_IDENTITY_COOKIE_NAME,value:"seed-shared-faculty",url:"http://localhost:3000",httpOnly:true,sameSite:"Lax"},
  {name:E2E_SECRET_COOKIE_NAME,value:secret!,url:"http://localhost:3000",httpOnly:true,sameSite:"Lax"},
  {name:"lms_membership",value:SEED_IDS.facultyCollegeAMembership,
    url:"http://localhost:3000",httpOnly:true,sameSite:"Lax"},
 ]);
}
test("Faculty Class schedule screenshot 12 supports week/day/month, scoped classes and mobile scrolling",async({page,context})=>{
 test.setTimeout(120000);
 await login(context);
 await page.setViewportSize({width:1440,height:900});
 const errors:string[]=[];
 page.on("pageerror",e=>errors.push(e.message));
 await page.goto("/teacher/calendar");
 await expect(page.getByRole("heading",{level:1,name:"Class Schedule"})).toBeVisible();
 const calendar=page.getByRole("region",{name:"Faculty class schedule prototype"});
 await expect(calendar).toBeVisible();
 const view=calendar.getByRole("group",{name:"Calendar views"});
 const week=view.getByRole("button",{name:"Week",exact:true});
 const day=view.getByRole("button",{name:"Day",exact:true});
 const month=view.getByRole("button",{name:"Month",exact:true});
 await expect(week).toHaveAttribute("aria-pressed","true");
 const grid=calendar.getByRole("region",{name:"Calendar dates, scroll horizontally for other days"});
 const dates=grid.locator("section[aria-label$=' IST']");
 await expect(dates).toHaveCount(7);
 await day.click();
 await expect(day).toHaveAttribute("aria-pressed","true");
 await expect(dates).toHaveCount(1);
 await month.click();
 await expect(month).toHaveAttribute("aria-pressed","true");
 const monthCount=await dates.count();
 expect(monthCount).toBeGreaterThanOrEqual(28);
 expect(monthCount).toBeLessThanOrEqual(42);
 await week.click();
 await expect(dates).toHaveCount(7);
 await expect(calendar.getByRole("heading",{name:"Next 3 classes"})).toBeVisible();
 await expect(calendar.getByRole("combobox",{name:"Filter class schedule by course"})).toBeVisible();
 await page.setViewportSize({width:390,height:844});
 await expect(calendar).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(391);
 await expect(grid).toHaveAttribute("tabindex","0");
 expect(errors).toEqual([]);
});
