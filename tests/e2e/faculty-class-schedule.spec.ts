import {randomUUID} from "node:crypto";
import {expect,test,type BrowserContext} from "@playwright/test";
import {E2E_IDENTITY_COOKIE_NAME,E2E_SECRET_COOKIE_NAME} from "../../src/auth/e2e-identity";
import {SEED_IDS} from "../../scripts/db-seed-data";
const secret=process.env.E2E_AUTH_SECRET;
test.skip(!secret||process.env.E2E_AUTH_ENABLED!=="true",
 "Faculty schedule E2E requires disposable auth and database");
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
for(const view of [{name:"desktop",width:1280,height:800,day:"27"},{name:"mobile",width:390,height:844,day:"29"}]){
 test("Faculty Class Schedule "+view.name+" persists, filters and dates exact IST session",async({page,context},testInfo)=>{
  test.setTimeout(90_000);
  await login(context);
  await page.setViewportSize({width:view.width,height:view.height});
  const errors:string[]=[];
  page.on("pageerror",e=>errors.push(e.message));
  await page.goto("/teacher/courses");
  await page.getByRole("link",{name:/E2E Browser Course/}).click();
  await expect(page).toHaveURL(/\/teacher\/courses\/[0-9a-f-]{36}\/home$/i,{timeout:20000});
  const current=new URL(page.url());
  const deliveryId=current.pathname.split("/")[3]!;
  expect(deliveryId).toMatch(/^[0-9a-f-]{36}$/i);
  const title="Calendar IST "+view.name+" "+randomUUID().slice(0,8);
  const startHour=9+testInfo.retry*2;
  const hour=String(startHour).padStart(2,"0");
  const endHour=String(startHour+1).padStart(2,"0");
  const submitted=await page.evaluate(async ({deliveryId,title,day,hour,endHour})=>{
   const response=await fetch("/api/courses/faculty/attendance/"+deliveryId+"/schedule",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
     action:"CREATE",title,description:"Faculty schedule browser witness",
     location:"Room 42",startsAt:"2026-10-"+day+"T"+hour+":00:00+05:30",
     endsAt:"2026-10-"+day+"T"+endHour+":00:00+05:30",confirm:true,
    }),
   });
   return {status:response.status,data:await response.json()};
  },{deliveryId,title,day:view.day,hour,endHour});
  expect(submitted.status,JSON.stringify(submitted.data)).toBe(200);
  const createdId:string=submitted.data?.result?.id;
  expect(createdId).toMatch(/^[0-9a-f-]{36}$/i);
  await page.goto("/teacher/calendar?month=2026-10&deliveryId="+deliveryId);
  await expect(page.getByRole("heading",{level:1,name:"Class Schedule",exact:true})).toBeVisible();
  await page.getByText("Advanced schedule and full calendar",{exact:true}).click();
  await page.getByRole("group",{name:"Calendar views"}).getByRole("button",{name:"Month",exact:true}).click();
  const calendar=page.getByRole("region",{name:"Faculty class schedule prototype"});
  await expect(calendar).toBeVisible();
  await expect(calendar).toContainText(title,{timeout:20000});
  const dateCell=calendar.locator('section[aria-label="2026-10-'+view.day+' IST"]');
  await expect(dateCell).toBeVisible();
  await expect(dateCell).toContainText("Room 42");
  await expect(dateCell.getByRole("link",{name:"Attendance"}).first()).toHaveAttribute(
   "href","/teacher/courses/"+deliveryId+"/attendanceDetail");
  const views=page.getByRole("group",{name:"Calendar views"});
  await views.getByRole("button",{name:"Week",exact:true}).click();
  await expect(views.getByRole("button",{name:"Week",exact:true})).toHaveAttribute("aria-pressed","true");
  await views.getByRole("button",{name:"Day",exact:true}).click();
  await expect(views.getByRole("button",{name:"Day",exact:true})).toHaveAttribute("aria-pressed","true");
  await views.getByRole("button",{name:"Month",exact:true}).click();
  await expect(views.getByRole("button",{name:"Month",exact:true})).toHaveAttribute("aria-pressed","true");
  await page.goto("/teacher/calendar?month=2026-13");
  await expect(page.locator('section[role="alert"]')).toContainText("Invalid month or Section filter");
  // App Router can stream an authorization error boundary with HTTP 200.
  // Verify denied content, rather than treating the transport status as auth.
  await page.goto("/teacher/calendar?month=2026-10&deliveryId="+SEED_IDS.collegeB);
  await expect(page.getByRole("region",{name:"Faculty class schedule prototype"})).toHaveCount(0);
  await expect(page).not.toHaveURL(/deliveryId=[0-9a-f-]{36}.*#authorized/i);
  await expect(page.getByText(title,{exact:true})).toHaveCount(0);
  await expect(page.getByRole("region",{name:"IST month schedule grid"})).toHaveCount(0);
  if(view.name==="mobile"){
   await page.goto("/teacher/calendar?month=2026-10&deliveryId="+deliveryId);
   const width=await page.evaluate(()=>document.documentElement.scrollWidth);
   expect(width).toBeLessThanOrEqual(view.width+1);
  }
  expect(errors).toEqual([]);
 });
}
