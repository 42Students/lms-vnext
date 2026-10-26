import {randomUUID} from "node:crypto";
import {expect,test,type BrowserContext} from "@playwright/test";
import {E2E_IDENTITY_COOKIE_NAME,E2E_SECRET_COOKIE_NAME} from "../../src/auth/e2e-identity";
import {SEED_IDS} from "../../scripts/db-seed-data";
const secret=process.env.E2E_AUTH_SECRET;
test.skip(!secret||process.env.E2E_AUTH_ENABLED!=="true","Faculty Assignment E2E requires disposable database");
// Both journeys share one persisted course; serialize draft sequencing to avoid
// artificial conflicts between independent browser workers.
test.describe.configure({mode:"serial"});
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
 test("Faculty Assignments "+view.name+" persists draft, edit, publish, archive and denies foreign scope",async({page,context})=>{
  test.setTimeout(100_000);
  await login(context);
  await page.setViewportSize({width:view.width,height:view.height});
  const errors:string[]=[];
  page.on("pageerror",error=>errors.push(error.message));
  await page.goto("/teacher/courses");
  await page.getByRole("link",{name:/E2E Browser Course/}).click();
  // Next App Router client navigation can resolve after Playwright click.
  // Never extract a delivery ID from the previous /teacher/courses URL.
  await expect(page).toHaveURL(/\/teacher\/courses\/[0-9a-f-]{36}\/home$/i,{timeout:20000});
  const deliveryId=new URL(page.url()).pathname.split("/")[3]!;
  expect(deliveryId).toMatch(/^[0-9a-f-]{36}$/i);
  await page.goto("/teacher/courses/"+deliveryId+"/assignments/manage");
  const manageHeading=page.getByRole("heading",{level:1,name:"Section assignments"});
  try{
   await manageHeading.waitFor({state:"visible",timeout:8000});
  }catch{
   const rendered=(await page.locator("body").innerText()).slice(0,2300);
   throw new Error("Faculty manage route "+page.url()+" rendered: "+rendered);
  }
  await expect(page.getByRole("heading",{name:"Assignment authoring"})).toBeVisible();
  const baseTitle="Faculty Assignment "+view.name+" "+randomUUID().slice(0,8);
  await page.getByRole("textbox",{name:"Title",exact:true}).fill(baseTitle);
  await page.getByRole("textbox",{name:"Text instructions"}).fill("Text-only Section instructions for current roster.");
  await page.getByRole("spinbutton",{name:"Maximum points"}).fill("20");
  await page.getByRole("textbox",{name:"Due date (IST, required before publishing)"}).fill(new Date(Date.now()+14*86400000).toISOString().slice(0,16));
  await page.getByRole("checkbox",{name:"Publish now"}).uncheck();
  const createdResponse=page.waitForResponse(res=>res.request().method()==="POST"&&
   new URL(res.url()).pathname==="/api/courses/faculty/assignments/"+deliveryId+"/command");
  await page.getByRole("button",{name:"Create draft"}).click();
  const created=await createdResponse;
  expect(created.status()).toBe(200);
  const createdBody=await created.json();
  const assignmentId:string=createdBody.assignment?.id;
  expect(assignmentId).toMatch(/^[0-9a-f-]{36}$/i);
  await page.reload();
  const choices=page.getByRole("combobox",{name:"Choose draft or create new"});
  await choices.selectOption({label:baseTitle+" (DRAFT)"});
  await expect(page.getByText("Current state: DRAFT.",{exact:false})).toBeVisible();
  await page.getByRole("textbox",{name:"Title",exact:true}).fill(baseTitle+" revised");
  const editedResponse=page.waitForResponse(res=>res.request().method()==="POST"&&
   new URL(res.url()).pathname==="/api/courses/faculty/assignments/"+deliveryId+"/command");
  await page.getByRole("button",{name:"Save draft"}).click();
  const edited=await editedResponse;
  expect(edited.status()).toBe(200);
  const editBody=await edited.json();
  const staleToken=createdBody.assignment?.updatedAt;
  expect(editBody.assignment?.title).toBe(baseTitle+" revised");
  const stale=await page.evaluate(async ({deliveryId,assignmentId,staleToken})=>{
   const result=await fetch("/api/courses/faculty/assignments/"+deliveryId+"/command",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
     action:"ARCHIVE",assignmentId,expectedUpdatedAt:staleToken,confirmed:true,
    }),
   });return result.status;
  },{deliveryId,assignmentId,staleToken});
  expect(stale).toBeGreaterThanOrEqual(400);
  await page.reload();
  await page.getByRole("combobox",{name:"Choose draft or create new"})
   .selectOption({label:baseTitle+" revised (DRAFT)"});
  const publish=page.waitForResponse(res=>res.request().method()==="POST"&&
   new URL(res.url()).pathname==="/api/courses/faculty/assignments/"+deliveryId+"/command");
  await page.getByRole("button",{name:"Publish",exact:true}).click();
  expect((await publish).status()).toBe(200);
  await page.reload();
  await page.getByRole("combobox",{name:"Choose draft or create new"})
   .selectOption({label:baseTitle+" revised (PUBLISHED)"});
  await expect(page.getByRole("button",{name:"Save draft"})).toBeDisabled();

  // The legacy Faculty All Assignments surface is more than the authoring
  // form: verify persisted aggregate list, scoped status/search, review drawer
  // and report link against this real published Section assignment.
  await page.goto("/teacher/allAssignments");
  await expect(page.getByRole("heading",{level:1,name:"My Assignments"})).toBeVisible();
  await page.getByRole("textbox",{name:"Search assessments"}).fill(baseTitle+" revised");
  await page.getByRole("combobox",{name:"Status"}).selectOption("DRAFT");
  await expect(page.getByText("No matching assignments")).toBeVisible();
  await page.getByRole("combobox",{name:"Status"}).selectOption("PUBLISHED");
  await page.getByRole("textbox",{name:"Search assessments"}).fill(baseTitle+" revised");
  const publishedCard=page.locator("article").filter({
   has:page.getByRole("heading",{name:baseTitle+" revised"}),
  });
  await expect(publishedCard).toBeVisible();
  await expect(publishedCard.getByText("This Section")).toBeVisible();
  await publishedCard.getByText("Actions",{exact:true}).click();
  await expect(publishedCard.getByRole("link",{name:"View submissions"}))
   .toHaveAttribute("href",new RegExp("/teacher/report/assignment/"+assignmentId));
  await publishedCard.getByRole("link",{name:"View Report"}).click();
  await expect(page).toHaveURL(new RegExp(
   "/teacher/report/assignment/"+assignmentId+"\\?deliveryId="+deliveryId,
  ));
  await page.goto("/teacher/courses/"+deliveryId+"/assignments/manage");
  await page.getByRole("combobox",{name:"Choose draft or create new"})
   .selectOption({label:baseTitle+" revised (PUBLISHED)"});
  const archive=page.waitForResponse(res=>res.request().method()==="POST"&&
   new URL(res.url()).pathname==="/api/courses/faculty/assignments/"+deliveryId+"/command");
  await page.getByRole("button",{name:"More"}).click();
  await page.getByRole("menuitem",{name:"Archive"}).click();
  await page.getByRole("alertdialog").getByRole("button",{name:"Confirm"}).click();
  const archived=await archive;
  expect(archived.status()).toBe(200);
  expect((await archived.json()).assignment?.status).toBe("ARCHIVED");
  await page.reload();
  // Archived rows are deliberately hidden from the active authoring list.
  await expect(page.getByRole("combobox",{name:"Choose draft or create new"}))
   .not.toContainText(baseTitle+" revised");
  const foreign=await page.evaluate(async ({assignmentId,foreignDeliveryId})=>{
   const response=await fetch("/api/courses/faculty/assignments/"+foreignDeliveryId+"/command",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({action:"ARCHIVE",assignmentId,
     expectedUpdatedAt:new Date().toISOString(),confirmed:true}),
   });return response.status;
  },{assignmentId,foreignDeliveryId:SEED_IDS.collegeB});
  expect(foreign).toBeGreaterThanOrEqual(400);
  if(view.name==="mobile"){
   const width=await page.evaluate(()=>document.documentElement.scrollWidth);
   expect(width).toBeLessThanOrEqual(view.width+1);
  }
  expect(errors).toEqual([]);
 });
}
