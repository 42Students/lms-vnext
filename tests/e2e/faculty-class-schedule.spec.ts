import {randomUUID} from "node:crypto";
import {expect,test,type BrowserContext} from "@playwright/test";
import {E2E_IDENTITY_COOKIE_NAME,E2E_SECRET_COOKIE_NAME} from "../../src/auth/e2e-identity";
import {SEED_IDS} from "../../scripts/db-seed-data";
const secret=process.env.E2E_AUTH_SECRET;
test.skip(!secret||process.env.E2E_AUTH_ENABLED!=="true",
 "Faculty schedule E2E requires disposable auth and database");
async function login(context:BrowserContext){
 await context.addCookies([
  {name:E2E_IDENTITY_COOKIE_NAME,value:"seed-shared-faculty",
   url:"http://localhost:3000",httpOnly:true,sameSite:"Lax"},
  {name:E2E_SECRET_COOKIE_NAME,value:secret!,
   url:"http://localhost:3000",httpOnly:true,sameSite:"Lax"},
  {name:"lms_membership",value:SEED_IDS.facultyCollegeAMembership,
   url:"http://localhost:3000",httpOnly:true,sameSite:"Lax"},
 ]);
}
for(const view of [{name:"desktop",width:1280,height:800,day:"27"},{name:"mobile",width:390,height:844,day:"29"}]){
 test("Faculty Class Schedule "+view.name+" persists, filters and dates exact IST session",async({page,context})=>{
  test.setTimeout(90_000);
  await login(context);
  await page.setViewportSize({width:view.width,height:view.height});
  const errors:string[]=[];
  page.on("pageerror",e=>errors.push(e.message));
  await page.goto("/teacher/courses");
  await page.getByRole("link",{name:/E2E Browser Course/}).click();
  const current=new URL(page.url());
  const deliveryId=current.pathname.split("/")[3]!;
  expect(deliveryId).toMatch(/^[0-9a-f-]{36}$/i);
  const title="Calendar IST "+view.name+" "+randomUUID().slice(0,8);
  const submitted=await page.evaluate(async ({deliveryId,title,day})=>{
   const response=await fetch("/api/courses/faculty/attendance/"+deliveryId+"/schedule",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
     action:"CREATE",title,description:"Faculty schedule browser witness",
     location:"Room 42",startsAt:"2026-10-"+day+"T09:00:00+05:30",
     endsAt:"2026-10-"+day+"T10:00:00+05:30",confirm:true,
    }),
   });
   return {status:response.status,data:await response.json()};
  },{deliveryId,title,day:view.day});
  expect(submitted.status,JSON.stringify(submitted.data)).toBe(200);
  const createdId:string=submitted.data?.result?.id;
  expect(createdId).toMatch(/^[0-9a-f-]{36}$/i);
  await page.goto("/teacher/calendar?month=2026-10&deliveryId="+deliveryId);
  await expect(page.getByRole("heading",{level:1,name:"Class Schedule"})).toBeVisible();
  await expect(page.getByLabel("Teaching Section")).toHaveValue(deliveryId);
  await expect(page.getByLabel("Month (IST)")).toHaveValue("2026-10");
  const grid=page.getByRole("region",{name:"IST month schedule grid"});
  await expect(grid.getByText(title,{exact:true})).toHaveCount(1);
  const day=page.getByRole("region",{name:"2026-10-"+view.day+" IST"});
  await expect(day.getByText(title,{exact:true})).toBeVisible();
  await expect(day.getByText(/9:00.*IST/)).toBeVisible();
  await expect(day.getByRole("link",{name:"Course Section"})).toHaveAttribute(
   "href","/teacher/courses/"+deliveryId+"/home",
  );
  await page.getByRole("link",{name:"Previous month"}).click();
  await expect(page.getByLabel("Month (IST)")).toHaveValue("2026-09");
  await expect(page.getByRole("region",{name:"IST month schedule grid"}).getByText(title)).toHaveCount(0);
  await page.getByRole("link",{name:"Next month"}).click();
  await expect(page.getByLabel("Month (IST)")).toHaveValue("2026-10");
  await expect(page.getByText(title,{exact:true}).first()).toBeVisible();
  await expect(page.getByRole("heading",{name:"Detailed day/week schedule"})).toBeVisible();
  await page.getByLabel("View",{exact:true}).selectOption("day");
  await page.getByLabel("View",{exact:true}).selectOption("week");
  await page.getByLabel("View",{exact:true}).selectOption("month");
  await page.goto("/teacher/calendar?month=2026-13");
  await expect(page.getByRole("alert")).toContainText("Invalid month or Section filter");
  const denied=await page.goto("/teacher/calendar?month=2026-10&deliveryId="+SEED_IDS.collegeB);
  expect(denied?.status()).toBeGreaterThanOrEqual(400);
  if(view.name==="mobile"){
   await page.goto("/teacher/calendar?month=2026-10&deliveryId="+deliveryId);
   const width=await page.evaluate(()=>document.documentElement.scrollWidth);
   expect(width).toBeLessThanOrEqual(view.width+1);
  }
  expect(errors).toEqual([]);
 });
}
