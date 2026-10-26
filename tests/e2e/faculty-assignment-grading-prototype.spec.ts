import {randomUUID} from "node:crypto";
import {expect,test,type BrowserContext} from "@playwright/test";
import {E2E_IDENTITY_COOKIE_NAME,E2E_SECRET_COOKIE_NAME} from "../../src/auth/e2e-identity";
import {SEED_IDS} from "../../scripts/db-seed-data";
const secret=process.env.E2E_AUTH_SECRET;
test.skip(!secret||process.env.E2E_AUTH_ENABLED!=="true",
 "Faculty Grading prototype requires isolated authenticated E2E database");
async function login(context:BrowserContext){
 await context.addCookies([
  {name:"lms_role",value:"FACULTY",url:"http://localhost:3000",httpOnly:true,sameSite:"Lax"},
  {name:E2E_IDENTITY_COOKIE_NAME,value:"seed-shared-faculty",url:"http://localhost:3000",httpOnly:true,sameSite:"Lax"},
  {name:E2E_SECRET_COOKIE_NAME,value:secret!,url:"http://localhost:3000",httpOnly:true,sameSite:"Lax"},
  {name:"lms_membership",value:SEED_IDS.facultyCollegeAMembership,url:"http://localhost:3000",httpOnly:true,sameSite:"Lax"},
 ]);
}
test("Faculty Grading #10 resolves exact Section, empty submissions, filters and denies forged cross-college delivery",async({page,context})=>{
 test.setTimeout(140_000);
 await login(context);
 await page.setViewportSize({width:1440,height:900});
 const errors:string[]=[];
 page.on("pageerror",error=>errors.push(error.message));
 await page.goto("/teacher/courses");
 await page.getByRole("link",{name:/E2E Browser Course/}).first().click();
 await expect(page).toHaveURL(/\/teacher\/courses\/[0-9a-f-]{36}\/home$/i);
 const deliveryId=new URL(page.url()).pathname.split("/")[3]!;
 await page.goto("/teacher/courses/"+deliveryId+"/assignments/manage");
 await expect(page.getByRole("heading",{name:"Assignment authoring"})).toBeVisible();
 const title="Faculty grading empty "+randomUUID().slice(0,8);
 await page.getByRole("textbox",{name:"Title",exact:true}).fill(title);
 await page.getByRole("textbox",{name:"Text instructions"}).fill("Section-only grading acceptance fixture");
 await page.getByRole("checkbox",{name:"Publish now"}).uncheck();
 const request=page.waitForResponse(response=>response.request().method()==="POST"&&
  new URL(response.url()).pathname==="/api/courses/faculty/assignments/"+deliveryId+"/command");
 await page.getByRole("button",{name:"Create draft"}).click();
 const saved=await request;
 expect(saved.status()).toBe(200);
 const payload=await saved.json();
 const assignmentId:string=payload.assignment?.id;
 expect(assignmentId).toMatch(/^[0-9a-f-]{36}$/i);
 const root="/teacher/report/assignment/"+assignmentId+"/grade?deliveryId="+deliveryId;
 await page.goto(root);
 const pane=page.getByRole("region",{name:"Faculty assignment grading prototype"});
 await expect(pane.getByRole("heading",{level:1,name:title})).toBeVisible();
 await expect(pane.getByRole("navigation",{name:"Submission grading filters"})).toBeVisible();
 await expect(pane.getByText("Select a submitted learner to see their work.")).toBeVisible();
 await page.goto(root+"&filter=graded&student="+SEED_IDS.learnerCollegeAMembership);
 await expect(pane.getByText("No matching submissions.")).toBeVisible();
 await expect(pane.getByRole("region",{name:"Grade selected submission"})).toHaveCount(0);
 await page.goto(root+"&filter=missing");
 await expect(pane.getByText("Missing submission")).toBeVisible();
 await expect(pane.getByRole("region",{name:"Grade selected submission"})).toHaveCount(0);
 await page.goto("/teacher/report/assignment/"+assignmentId+"/grade?deliveryId="+SEED_IDS.collegeB);
 await expect(pane).toHaveCount(0);
 await page.setViewportSize({width:390,height:844});
 await page.goto(root);
 await expect(pane.getByRole("heading",{level:1,name:title})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(391);
 expect(errors).toEqual([]);
});
