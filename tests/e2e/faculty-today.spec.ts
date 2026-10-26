import {expect,test,type BrowserContext} from "@playwright/test";
import {E2E_IDENTITY_COOKIE_NAME,E2E_SECRET_COOKIE_NAME} from "../../src/auth/e2e-identity";
import {SEED_IDS} from "../../scripts/db-seed-data";

const secret=process.env.E2E_AUTH_SECRET;
test.skip(!secret||process.env.E2E_AUTH_ENABLED!=="true",
 "Faculty Today acceptance requires disposable authenticated browser and database");

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

test("Faculty Today shows the prototype's side cards and truthful task count on desktop and mobile",
 async({page,context})=>{
  await login(context);
  await page.setViewportSize({width:1440,height:1000});
  const errors:string[]=[];
  page.on("pageerror",error=>errors.push(error.message));
  await page.goto("/teacher");
  const today=page.locator(".faculty-proto-today");
  await expect(today.getByRole("heading",{level:1,name:/things? needs? you\./i})).toBeVisible();
  const queue=today.locator(":scope > div > div").first();
  const cards=today.locator("aside[aria-label=\"Today's classes and this week\"]");
  await expect(cards.getByRole("heading",{name:"Today's classes"})).toBeVisible();
  await expect(cards.getByRole("heading",{name:"This week"})).toBeVisible();
  await expect(cards.getByRole("link",{name:/Schedule/})).toHaveAttribute("href","/teacher/calendar");
  // Genuine Playwright renders for side-by-side review, never resized copies of the prototype.
  await page.screenshot({path:"test-results/faculty-today-desktop-1440x1000.png",fullPage:true});
  const queueBox=await queue.boundingBox();
  const cardsBox=await cards.boundingBox();
  expect(queueBox).not.toBeNull();
  expect(cardsBox).not.toBeNull();
  expect(cardsBox!.x).toBeGreaterThan(queueBox!.x+queueBox!.width-2);

  const count=await page.evaluate(async()=>{
   const response=await fetch("/api/courses/faculty/shell-counts",{cache:"no-store"});
   if(!response.ok)throw new Error("Faculty shell-counts returned "+response.status);
   return (await response.json() as {today:number}).today;
  });
  expect(count).toBe(await today.locator(".faculty-proto-task").count());

  const later=today.getByRole("button",{name:"Later",exact:true});
  if(await later.count()){
   await later.first().click();
   await expect(today.getByRole("button",{name:/Show 1 hidden item/})).toBeVisible();
   await today.getByRole("button",{name:/Show 1 hidden item/}).click();
   expect(await today.locator(".faculty-proto-task").count()).toBe(count);
  }

  await page.setViewportSize({width:390,height:844});
  await expect(cards.getByRole("heading",{name:"Today's classes"})).toBeVisible();
  const mobileQueue=await queue.boundingBox();
  const mobileCards=await cards.boundingBox();
  expect(mobileQueue).not.toBeNull();
  expect(mobileCards).not.toBeNull();
  expect(mobileCards!.y).toBeGreaterThanOrEqual(mobileQueue!.y+mobileQueue!.height-2);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(391);
  await page.screenshot({path:"test-results/faculty-today-mobile-390x844.png",fullPage:true});
  expect(errors).toEqual([]);
 });
