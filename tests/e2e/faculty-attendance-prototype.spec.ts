import {expect,test,type BrowserContext} from "@playwright/test";
import {E2E_IDENTITY_COOKIE_NAME,E2E_SECRET_COOKIE_NAME} from "../../src/auth/e2e-identity";
import {SEED_IDS} from "../../scripts/db-seed-data";

const secret=process.env.E2E_AUTH_SECRET;
test.skip(!secret||process.env.E2E_AUTH_ENABLED!=="true",
 "Faculty Attendance prototype acceptance requires disposable authenticated PostgreSQL");
async function login(context:BrowserContext){
 await context.addCookies([
  {name:"lms_role",value:"FACULTY",url:"http://localhost:3000",httpOnly:true,sameSite:"Lax"},
  {name:E2E_IDENTITY_COOKIE_NAME,value:"seed-shared-faculty",url:"http://localhost:3000",httpOnly:true,sameSite:"Lax"},
  {name:E2E_SECRET_COOKIE_NAME,value:secret!,url:"http://localhost:3000",httpOnly:true,sameSite:"Lax"},
  {name:"lms_membership",value:SEED_IDS.facultyCollegeAMembership,url:"http://localhost:3000",httpOnly:true,sameSite:"Lax"},
 ]);
}
test("Faculty screenshot #07 chooses active session, searches roster and opens real scheduling tools",async({page,context})=>{
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
 const deliveryId=new URL(page.url()).pathname.split("/")[3]!;
 const start=new Date(Date.now()-10000).toISOString();
 const end=new Date(Date.now()+15*60000).toISOString();
 const created=await page.evaluate(async({deliveryId,start,end})=>{
  const response=await fetch("/api/courses/faculty/attendance/"+deliveryId+"/schedule",{
   method:"POST",headers:{"Content-Type":"application/json"},
   body:JSON.stringify({action:"CREATE",title:"Faculty Prototype Live Session",
    location:"Room prototype",startsAt:start,endsAt:end,description:"Prototype marking",confirm:true}),
  });
  return {status:response.status,data:await response.json()};
 },{deliveryId,start,end});
 expect(created.status,JSON.stringify(created.data)).toBe(200);
 const sessionId:string=created.data?.result?.id;
 expect(sessionId).toMatch(/^[0-9a-f-]{36}$/i);
 await page.goto("/teacher/courses/"+deliveryId+"/attendanceDetail");
 const panel=page.getByRole("region",{name:"Faculty prototype attendance"});
 await expect(panel).toBeVisible();
 await expect(panel.getByRole("heading",{name:/Room prototype/})).toBeVisible();
 const views=panel.getByRole("group",{name:"Attendance view"});
 await expect(views.getByRole("button",{name:"Mark attendance"})).toHaveAttribute("aria-pressed","true");
 const search=panel.getByRole("textbox",{name:"Find a student by name"});
 await search.fill("no-matching-learner-prototype");
 await expect(panel.getByText("No students match your search.")).toBeVisible();
 await search.fill("");
 await expect(panel.getByRole("button",{name:"Mark everyone present"})).toBeEnabled();
 await views.getByRole("button",{name:"This month"}).click();
 await expect(panel.getByRole("heading",{name:/attendance$/})).toBeVisible();
 await panel.getByRole("link",{name:"Mark attendance"}).first().click();
 await expect(views.getByRole("button",{name:"Mark attendance"})).toHaveAttribute("aria-pressed","true");
 await panel.getByRole("link",{name:"Schedule a class"}).click();
 const scheduling=page.locator("#faculty-attendance-scheduling");
 await expect(scheduling).toHaveAttribute("open","");
 await expect(scheduling).toContainText("Advanced attendance session scheduling");
 await page.setViewportSize({width:390,height:844});
 await expect(page.getByRole("region",{name:"Faculty prototype attendance"})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(391);
 expect(errors).toEqual([]);
});