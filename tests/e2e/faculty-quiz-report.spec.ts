import {randomUUID} from "node:crypto";
import {readFile} from "node:fs/promises";
import {expect,test,type BrowserContext} from "@playwright/test";
import {E2E_IDENTITY_COOKIE_NAME,E2E_SECRET_COOKIE_NAME} from "../../src/auth/e2e-identity";
import {SEED_IDS} from "../../scripts/db-seed-data";
const secret=process.env.E2E_AUTH_SECRET;
test.skip(!secret,"Quiz Report requires isolated browser credentials");
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
for(const view of [{name:"desktop",width:1280,height:800},{name:"mobile",width:390,height:844}]){
 test("Faculty Quiz Report "+view.name+" persisted question accuracy and safe CSV",async({page,context})=>{
  test.setTimeout(90_000);
  await login(context);
  await page.setViewportSize({width:view.width,height:view.height});
  const errors:string[]=[];
  page.on("pageerror",e=>errors.push(e.message));
  // The new Faculty UI authors quizzes inside each assigned Section;
  // don't assume the retired global + Create Quiz dialog exists.
  await page.goto("/teacher/courses");
  await page.getByRole("link",{name:/E2E Browser Course/}).first().click();
  await expect(page).toHaveURL(/\/teacher\/courses\/[0-9a-f-]{36}\/home$/i,{timeout:20000});
  const deliveryId=new URL(page.url()).pathname.split("/")[3]!;
  await page.goto("/teacher/courses/"+deliveryId+"/quizzes/manage");
  await expect(page.getByRole("heading",{name:"Choice-question quiz builder"})).toBeVisible();
  const title="Faculty Quiz Report "+randomUUID().slice(0,8);
  await page.getByRole("textbox",{name:"Quiz title"}).fill(title);
  await page.getByRole("textbox",{name:"Prompt"}).fill("What is 1+1?");
  await page.getByRole("textbox",{name:"Option 1"}).fill("Two");
  await page.getByRole("textbox",{name:"Option 2"}).fill("Three");
  await page.getByRole("checkbox",{name:"Publish now"}).uncheck();
  const request=page.waitForResponse(res=>
   res.request().method()==="POST"&&
   new URL(res.url()).pathname==="/api/courses/faculty/quizzes/"+deliveryId+"/command");
  await page.getByRole("button",{name:"Create draft"}).click();
  const response=await request;
  const created=await response.json();
  expect(response.status(),JSON.stringify(created)).toBe(200);
  const id:string=created.quiz?.id;
  expect(id).toMatch(/^[0-9a-f-]{36}$/i);
  expect(deliveryId).toMatch(/^[0-9a-f-]{36}$/i);
  await page.goto("/teacher/report/quiz/"+id+"?deliveryId="+deliveryId);
  await expect(page.getByRole("heading",{level:1,name:title})).toBeVisible();
  await expect(page.getByRole("heading",{name:"Question accuracy"})).toBeVisible();
  await expect(page.getByRole("heading",{name:"Score distribution"})).toBeVisible();
  await expect(page.getByRole("link",{name:/Individual attempts & question accuracy/})).toBeVisible();
  const links=page.getByRole("navigation",{name:"Quiz CSV response filters"});
  await expect(links.getByRole("link",{name:"Export attempted only"})).toBeVisible();
  await expect(links.getByRole("link",{name:"Export not attempted only"})).toBeVisible();
  const downloadLink=page.getByRole("link",{name:"Download current faculty report as CSV"});
  const started=page.waitForEvent("download");
  await downloadLink.click();
  const download=await started;
  expect(download.suggestedFilename().startsWith("faculty-quiz-report-")).toBe(true);
  const csv=await readFile((await download.path())!,"utf8");
  expect(csv).toContain('"Learner","Response","Score","Percent","Submitted at (IST)","Details"');
  expect(csv).not.toContain("@example.");
  expect(csv).not.toContain("learner.seed@example.com");
  const filtered=page.waitForEvent("download");
  await links.getByRole("link",{name:"Export not attempted only"}).click();
  const missingDownload=await filtered;
  const missingCsv=await readFile((await missingDownload.path())!,"utf8");
  expect(missingCsv).toContain("NOT_ATTEMPTED");
  expect(missingCsv).not.toContain("@example.");
  const questionExport=page.waitForEvent("download");
  await page.getByRole("link",{name:"Download question accuracy CSV"}).click();
  const questionDownload=await questionExport;
  expect(questionDownload.suggestedFilename().includes("questions")).toBe(true);
  const questionCsv=await readFile((await questionDownload.path())!,"utf8");
  expect(questionCsv).toContain('"Question","Points","Answered","Correct","Accuracy (%)"');
  expect(questionCsv).toContain("What is 1+1?");
  expect(questionCsv).not.toContain("@example.");
  const denied=await page.evaluate(async args=>
   (await fetch("/api/courses/faculty/reports/quiz/"+args.id+
    "/question-csv?deliveryId="+args.other)).status,
   {id,other:SEED_IDS.collegeB});
  expect(denied).toBeGreaterThanOrEqual(400);
  if(view.name==="mobile"){
   const width=await page.evaluate(()=>document.documentElement.scrollWidth);
   expect(width).toBeLessThanOrEqual(view.width+1);
  }
  expect(errors).toEqual([]);
 });
}
