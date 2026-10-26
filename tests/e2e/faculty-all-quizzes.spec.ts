import {randomUUID} from "node:crypto";
import {expect,test,type BrowserContext} from "@playwright/test";
import {E2E_IDENTITY_COOKIE_NAME,E2E_SECRET_COOKIE_NAME} from "../../src/auth/e2e-identity";
import {SEED_IDS} from "../../scripts/db-seed-data";
const secret=process.env.E2E_AUTH_SECRET;
test.skip(!secret||process.env.E2E_AUTH_ENABLED!=="true","Faculty Quizzes require disposable E2E database");
test.describe.configure({mode:"serial"});

async function login(context:BrowserContext){
 await context.addCookies([
  {name:"lms_role",value:"FACULTY",url:"http://localhost:3000",httpOnly:true,sameSite:"Lax"},
  {name:E2E_IDENTITY_COOKIE_NAME,value:"seed-shared-faculty",url:"http://localhost:3000",httpOnly:true,sameSite:"Lax"},
  {name:E2E_SECRET_COOKIE_NAME,value:secret!,url:"http://localhost:3000",httpOnly:true,sameSite:"Lax"},
  {name:"lms_membership",value:SEED_IDS.facultyCollegeAMembership,url:"http://localhost:3000",httpOnly:true,sameSite:"Lax"},
 ]);
}
for(const view of [{name:"desktop",width:1280,height:800},{name:"mobile",width:390,height:844}]){
 test("Faculty All Quizzes "+view.name+" CREATE EDIT PUBLISH CLOSE results ARCHIVE",async({page,context})=>{
  test.setTimeout(120_000);
  await login(context);
  await page.setViewportSize({width:view.width,height:view.height});
  const errors:string[]=[];
  page.on("pageerror",e=>errors.push(e.message));
  await page.goto("/teacher/courses");
  await page.getByRole("link",{name:/E2E Browser Course/}).click();
  await expect(page).toHaveURL(/\/teacher\/courses\/[0-9a-f-]{36}\/home$/i,{timeout:20000});
  const deliveryId=new URL(page.url()).pathname.split("/")[3]!;
  const commandPath="/api/courses/faculty/quizzes/"+deliveryId+"/command";
  await page.goto("/teacher/courses/"+deliveryId+"/quizzes/manage");
  await expect(page.getByRole("heading",{level:1,name:"Section quizzes"})).toBeVisible();
  await expect(page.getByRole("heading",{name:"Choice-question quiz builder"})).toBeVisible();
  const title="Faculty Quiz "+view.name+" "+randomUUID().slice(0,8);
  await page.getByRole("textbox",{name:"Quiz title"}).fill(title);
  await page.getByRole("textbox",{name:"Prompt"}).fill("FIFO is?");
  await page.getByRole("textbox",{name:"Option 1"}).fill("Queue");
  await page.getByRole("textbox",{name:"Option 2"}).fill("Stack");
  await page.getByRole("textbox",{name:"Due date (IST, required before publishing)"}).fill(new Date(Date.now()+14*86400000).toISOString().slice(0,16));
  await page.getByRole("checkbox",{name:"Publish now"}).uncheck();
  page.once("dialog",dialog=>dialog.accept());
  const createResponse=page.waitForResponse(r=>r.request().method()==="POST"&&new URL(r.url()).pathname===commandPath);
  await page.getByRole("button",{name:"Create draft"}).click();
  const created=await createResponse;
  expect(created.status()).toBe(200);
  const body=await created.json();
  const id:string=body.quiz?.id;
  const version:string=body.quiz?.updatedAt;
  expect(id).toMatch(/^[0-9a-f-]{36}$/i);
  await page.reload();
  await page.getByRole("combobox",{name:"Quiz",exact:true}).selectOption({label:title+" (DRAFT)"});
  await expect(page.getByRole("textbox",{name:"Prompt"})).toHaveValue("FIFO is?");
  await page.getByRole("textbox",{name:"Quiz title"}).fill(title+" revised");
  await page.getByRole("textbox",{name:"Prompt"}).fill("FIFO structure?");
  page.once("dialog",dialog=>dialog.accept());
  const editResponse=page.waitForResponse(r=>r.request().method()==="POST"&&new URL(r.url()).pathname===commandPath);
  await page.getByRole("button",{name:"Save draft"}).click();
  const edited=await editResponse;
  expect(edited.status()).toBe(200);
  expect((await edited.json()).quiz?.title).toBe(title+" revised");
  const stale=await page.evaluate(async({commandPath,id,version})=>{
   const response=await fetch(commandPath,{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({action:"ARCHIVE",quizId:id,expectedUpdatedAt:version,confirmed:true})});
   return response.status;
  },{commandPath,id,version});
  expect(stale).toBeGreaterThanOrEqual(400);
  await page.reload();
  await page.getByRole("combobox",{name:"Quiz",exact:true}).selectOption({label:title+" revised (DRAFT)"});
  await expect(page.getByRole("textbox",{name:"Prompt"})).toHaveValue("FIFO structure?");
  page.once("dialog",dialog=>dialog.accept());
  const publishResponse=page.waitForResponse(r=>r.request().method()==="POST"&&new URL(r.url()).pathname===commandPath);
  await page.getByRole("button",{name:"Publish",exact:true}).click();
  const published=await publishResponse;
  expect(published.status()).toBe(200);
  expect((await published.json()).quiz?.status).toBe("PUBLISHED");

  await page.goto("/teacher/allQuizzes");
  await expect(page.getByRole("heading",{level:1,name:"My Quizzes"})).toBeVisible();
  await page.getByRole("combobox",{name:"Status"}).selectOption("PUBLISHED");
  await page.getByRole("textbox",{name:"Search assessments"}).fill(title+" revised");
  const card=page.locator("article").filter({has:page.getByRole("heading",{name:title+" revised"})});
  await expect(card).toBeVisible();
  await expect(card.getByText("This Section",{exact:true}).first()).toBeVisible();
  // The prototype-first card preserves advanced actions behind a disclosure.
  await card.locator("summary").filter({hasText:/^Actions/}).click();
  await card.getByRole("button",{name:"Review attempts"}).click();
  const drawer=page.getByRole("dialog",{name:"Quiz attempts"});
  await expect(drawer).toBeVisible();
  await expect(drawer.getByText("No Quiz attempts have been submitted for this Section yet.")).toBeVisible();
  await page.getByRole("button",{name:"Close drawer"}).click();
  await card.getByRole("link",{name:"View Report"}).click();
  await expect(page).toHaveURL(new RegExp("/teacher/report/quiz/"+id+"\\?deliveryId="+deliveryId));

  await page.goto("/teacher/courses/"+deliveryId+"/quizzes/manage");
  await page.getByRole("combobox",{name:"Quiz",exact:true}).selectOption({label:title+" revised (PUBLISHED)"});
  page.once("dialog",dialog=>dialog.accept());
  const closeResponse=page.waitForResponse(r=>r.request().method()==="POST"&&new URL(r.url()).pathname===commandPath);
  await page.getByRole("button",{name:"Close quiz"}).click();
  const closed=await closeResponse;
  expect(closed.status()).toBe(200);
  expect((await closed.json()).quiz?.status).toBe("CLOSED");

  await page.goto("/teacher/allQuizzes");
  await page.getByRole("combobox",{name:"Status"}).selectOption("CLOSED");
  await page.getByRole("textbox",{name:"Search assessments"}).fill(title+" revised");
  const closedCard=page.locator("article").filter({has:page.getByRole("heading",{name:title+" revised"})});
  await closedCard.locator("summary").filter({hasText:/^Actions/}).click();
  await expect(closedCard.getByRole("button",{name:"Publish results"})).toBeVisible();
  page.once("dialog",dialog=>dialog.accept());
  const resultsResponse=page.waitForResponse(r=>r.request().method()==="POST"&&new URL(r.url()).pathname==="/api/courses/quizzes/"+id+"/faculty-results");
  await closedCard.getByRole("button",{name:"Publish results"}).click();
  expect((await resultsResponse).status()).toBe(200);
  await expect(closedCard.getByRole("button",{name:"Hide results"})).toBeVisible();

  // Metadata-only edits remain legal after publication/close; quiz questions
  // and submitted answer snapshots must remain unchanged.
  await page.reload();
  await page.getByRole("combobox",{name:"Status"}).selectOption("CLOSED");
  await page.getByRole("textbox",{name:"Search assessments"}).fill(title+" revised");
  const metadataCard=page.locator("article").filter({has:page.getByRole("heading",{name:title+" revised"})});
  await metadataCard.locator("summary").filter({hasText:/^Actions/}).click();
  await metadataCard.getByRole("button",{name:"Edit",exact:true}).click();
  const metadataDrawer=page.getByRole("dialog",{name:"Edit Quiz"});
  await expect(metadataDrawer).toBeVisible();
  await metadataDrawer.getByRole("textbox",{name:"Title"}).fill(title+" metadata");
  page.once("dialog",dialog=>dialog.accept());
  const metadataResponse=page.waitForResponse(r=>r.request().method()==="PATCH"&&new URL(r.url()).pathname==="/api/courses/quizzes/"+id);
  await metadataDrawer.getByRole("button",{name:"Save changes"}).click();
  const metadata=await metadataResponse;
  expect(metadata.status()).toBe(200);
  await page.goto("/teacher/courses/"+deliveryId+"/quizzes/manage");
  await page.getByRole("combobox",{name:"Quiz",exact:true}).selectOption({label:title+" metadata (CLOSED)"});
  page.once("dialog",dialog=>dialog.accept());
  const archiveResponse=page.waitForResponse(r=>r.request().method()==="POST"&&new URL(r.url()).pathname===commandPath);
  await page.getByRole("button",{name:"Archive quiz"}).click();
  const archived=await archiveResponse;
  expect(archived.status()).toBe(200);
  expect((await archived.json()).quiz?.status).toBe("ARCHIVED");
  const foreign=await page.evaluate(async({id,foreignDeliveryId})=>{
   return (await fetch("/api/courses/faculty/quizzes/"+foreignDeliveryId+"/command",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({action:"ARCHIVE",quizId:id,expectedUpdatedAt:new Date().toISOString(),confirmed:true}),
   })).status;
  },{id,foreignDeliveryId:SEED_IDS.collegeB});
  expect(foreign).toBeGreaterThanOrEqual(400);
  if(view.name==="mobile"){
   const {width,offenders}=await page.evaluate(()=>{
    const width=document.documentElement.scrollWidth;
    const offenders=[...document.querySelectorAll("*")]
      .filter(el=>el.getBoundingClientRect().right>window.innerWidth+1)
      .slice(0,8).map(el=>({
       tag:el.tagName,classes:String(el.className).slice(0,120),
       right:Math.round(el.getBoundingClientRect().right),
      }));
    return {width,offenders};
   });
   expect(width,JSON.stringify(offenders)).toBeLessThanOrEqual(view.width+1);
  }
  expect(errors).toEqual([]);
 });
}
