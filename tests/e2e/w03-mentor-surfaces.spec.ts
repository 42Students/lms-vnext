import {expect,test,type BrowserContext} from "@playwright/test";
import {E2E_IDENTITY_COOKIE_NAME,E2E_SECRET_COOKIE_NAME} from "../../src/auth/e2e-identity";
import {SEED_IDS} from "../../scripts/db-seed-data";

const baseUrl="http://localhost:3000";
const e2eSecret=process.env.E2E_AUTH_SECRET;
async function authenticate(
  context:BrowserContext,uid:string,membership:string,
  role:"MENTOR"|"LEARNER"="MENTOR",
){
  if(!e2eSecret)throw Error("E2E_AUTH_SECRET required");
  await context.clearCookies();
  await context.addCookies([
    {name:E2E_IDENTITY_COOKIE_NAME,value:uid,url:baseUrl,httpOnly:true,sameSite:"Lax"},
    {name:E2E_SECRET_COOKIE_NAME,value:e2eSecret,url:baseUrl,httpOnly:true,sameSite:"Lax"},
    {name:"lms_membership",value:membership,url:baseUrl,httpOnly:true,sameSite:"Lax"},
    // Multi-role faculty defaults to a non-Mentor role without this
    // server-validated workspace selection.
    {name:"lms_role",value:role,url:baseUrl,httpOnly:true,sameSite:"Lax"},
  ]);
}

test.describe("W03 Mentor Meetings and Notifications browser parity",()=>{
  test.skip(!e2eSecret,"Authenticated Playwright requires E2E_AUTH_SECRET");
  test("Mentor sees Projects entry, Meetings and Notifications routes",async({page,context})=>{
    await authenticate(context,"seed-shared-faculty",SEED_IDS.facultyCollegeAMembership);
    await page.goto("/mentor");
    await expect(page).toHaveURL(/\/mentor\/projects(?:\?|$)/);
    await expect(page.locator(".prototype-mentor-home-heading h1")).toBeVisible();
    await page.getByRole("link",{name:"Meetings"}).last().click();
    await expect(page.getByRole("heading",{level:1,name:"Meetings"})).toBeVisible();
    await expect(page.getByRole("heading",{name:/Upcoming \(\d+\)/})).toBeVisible();
    await expect(page.getByRole("heading",{name:/Past & Cancelled \(\d+\)/})).toBeVisible();
    await page.goto("/mentor/notifications");
    await expect(page.getByRole("heading",{level:1,name:"Notifications"})).toBeVisible();
    await expect(page.getByRole("heading",{name:/Project attention \(\d+\)/})).toBeVisible();
    await expect(page.getByRole("heading",{name:"Personal notifications"})).toBeVisible();
  });
  test("Learner cannot access Mentor calendar or notifications via deep links",async({page,context})=>{
    await authenticate(context,"seed-learner",SEED_IDS.learnerCollegeAMembership,"LEARNER");
    await page.goto("/mentor/calendar");
    await expect(page).toHaveURL(/\/dashboard(?:\?|$)/);
    await page.goto("/mentor/notifications");
    await expect(page).toHaveURL(/\/dashboard(?:\?|$)/);
  });
});
