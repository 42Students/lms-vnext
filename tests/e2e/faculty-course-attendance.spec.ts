import {expect,test,type BrowserContext} from "@playwright/test";
import {E2E_IDENTITY_COOKIE_NAME,E2E_SECRET_COOKIE_NAME} from "../../src/auth/e2e-identity";
import {SEED_IDS} from "../../scripts/db-seed-data";

const secret=process.env.E2E_AUTH_SECRET;
test.skip(!secret||process.env.E2E_AUTH_ENABLED!=="true",
 "Faculty Attendance browser requires disposable database and auth");

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

test("Faculty Attendance desktop/mobile marks, corrects and shows real Section summary",async({page,context})=>{
  test.setTimeout(120_000);
  await login(context);
  await page.setViewportSize({width:1280,height:800});
  const errors:string[]=[];
  page.on("pageerror",error=>errors.push(error.message));
  await page.goto("/teacher/courses");
  await page.getByRole("link",{name:/E2E Browser Course/}).click();
  await expect(page).toHaveURL(/\/teacher\/courses\/[0-9a-f-]{36}\/home$/i);
  const deliveryId=new URL(page.url()).pathname.split("/")[3]!;
  // The live writer permits only a five-minute booking grace. A separate
  // mobile test would collide with this instructor\u0027s still-active session;
  // verify both viewport sizes against the SAME authorized marked session.
  // Keep nearly all of the writer's five-minute grace for CI scheduling
  // delays while retaining an already-started session for real attendance.
  const start=new Date(Date.now()-15_000).toISOString();
  // Retry-safe short class window. Correction remains possible during the college correction period.
  const end=new Date(Date.now()+30_000).toISOString();
  const creation=await page.evaluate(async ({deliveryId,start,end})=>{
   const response=await fetch("/api/courses/faculty/attendance/"+deliveryId+"/schedule",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
     action:"CREATE",title:"Faculty Attendance acceptance",description:"Section roll call",
     location:"Room A",startsAt:start,endsAt:end,confirm:true,
    }),
   });
   return {status:response.status,body:await response.json()};
  },{deliveryId,start,end});
  expect(creation.status,JSON.stringify(creation.body)).toBe(200);
  const sessionId:string=creation.body?.result?.id;
  expect(sessionId).toMatch(/^[0-9a-f-]{36}$/i);
  await page.goto("/teacher/courses/"+deliveryId+"/attendanceDetail?sessionId="+sessionId);
  const advanced=page.locator("#faculty-attendance-editor");
  await expect(advanced.getByRole("radio",{name:"Mark attendance"})).toBeVisible();
  await expect(advanced.getByLabel("Select Class")).toHaveValue(sessionId);
  await expect(page.getByText("Attendance has not been submitted for this session yet.")).toBeVisible();
  await advanced.getByRole("button",{name:"Mark all present"}).click();
  const marking=page.waitForResponse(r=>r.request().method()==="PATCH" &&
   new URL(r.url()).pathname==="/api/attendance/faculty/sessions/"+sessionId);
  await advanced.getByRole("button",{name:"Submit Attendance"}).click();
  await page.getByRole("alertdialog",{name:"Submit Attendance"}).getByRole("button",{name:"Confirm"}).click();
  const response=await marking;
  expect(response.status(),await response.text()).toBe(200);
  await expect(page.getByText("Attendance was already submitted. Saving again performs a correction.")).toBeVisible();
  await advanced.getByRole("button",{name:"Mark all absent"}).click();
  await advanced.getByPlaceholder("What changed in the recorded attendance?")
   .fill("Confirmed correction following classroom roll call");
  const correction=page.waitForResponse(r=>r.request().method()==="PATCH" &&
   new URL(r.url()).pathname==="/api/attendance/faculty/sessions/"+sessionId);
  await advanced.getByRole("button",{name:"Submit Attendance"}).click();
  await page.getByRole("alertdialog",{name:"Submit Attendance"}).getByRole("button",{name:"Confirm"}).click();
  const corrected=await correction;
  expect(corrected.status(),await corrected.text()).toBe(200);
  await advanced.getByRole("radio",{name:"Attendance report"}).click();
  await expect(page.getByRole("heading",{name:"Monthly class health"})).toBeVisible();
  await expect(page.getByRole("region",{name:"Monthly class health"})).toContainText("0%");
  await expect(page.getByRole("region",{name:"Attendance threshold guidance"})).toContainText("below guidance");
  await advanced.getByRole("button",{name:/View attendance details for/}).first().click();
  await expect(page.getByRole("dialog")).toContainText("Attendance");
  await page.getByRole("button",{name:"Close drawer"}).click();
  const foreign=await page.evaluate(async ({sessionId,otherCollege})=>{
   const response=await fetch("/api/attendance/faculty/sessions/"+sessionId,{
    method:"PATCH",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
     deliveryId:otherCollege,absentMembershipIds:[],presentMembershipIds:[],
    }),
   });
   return response.status;
  },{sessionId,otherCollege:SEED_IDS.collegeB});
  expect(foreign).toBeGreaterThanOrEqual(400);
  await page.setViewportSize({width:390,height:844});
  await page.reload();
  await expect(page.getByRole("region",{name:"Faculty prototype attendance"})).toBeVisible();
  const width=await page.evaluate(()=>document.documentElement.scrollWidth);
  expect(width).toBeLessThanOrEqual(391);
  expect(errors).toEqual([]);
 });
