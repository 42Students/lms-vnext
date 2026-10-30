import {expect,test,type BrowserContext} from "@playwright/test";
import {E2E_IDENTITY_COOKIE_NAME,E2E_SECRET_COOKIE_NAME} from "../../src/auth/e2e-identity";
import {SEED_IDS} from "../../scripts/db-seed-data";

const secret=process.env.E2E_AUTH_SECRET;
test.skip(!secret||process.env.E2E_AUTH_ENABLED!=="true"||!process.env.E2E_DATABASE_URL,
 "Only authenticated disposable PostgreSQL may run Faculty content lifecycle acceptance");

async function login(context:BrowserContext){
 await context.addCookies([
  {name:"lms_role",value:"FACULTY",url:"http://localhost:3000",httpOnly:true,sameSite:"Lax"},
  {name:E2E_IDENTITY_COOKIE_NAME,value:"seed-shared-faculty",url:"http://localhost:3000",httpOnly:true,sameSite:"Lax"},
  {name:E2E_SECRET_COOKIE_NAME,value:secret!,url:"http://localhost:3000",httpOnly:true,sameSite:"Lax"},
  {name:"lms_membership",value:SEED_IDS.facultyCollegeAMembership,
   url:"http://localhost:3000",httpOnly:true,sameSite:"Lax"},
 ]);
}

test("Faculty Blueprint persists YouTube and live-class create edit archive for its own Section",async({page,context})=>{
 test.setTimeout(210_000);
 await login(context);
 await page.goto("/teacher/courses");
 await page.getByRole("link",{name:/E2E Browser Course/}).first().click();
 const deliveryId=new URL(page.url()).pathname.split("/")[3]!;
 await page.getByRole("navigation",{name:"Faculty course tabs"})
  .getByRole("link",{name:"Blueprint"}).click();
 const explorer=page.getByRole("region",{name:"Course blueprint lesson explorer"});
 const chosen=explorer.getByRole("complementary").getByRole("link",{current:"page"});
 const lessonId=new URL((await chosen.getAttribute("href"))!,page.url()).searchParams.get("lesson");
 expect(lessonId).toMatch(/^[0-9a-f-]{36}$/i);
 const base="/teacher/courses/"+deliveryId+"/blueprint?lesson="+encodeURIComponent(lessonId!);
 const futureDate=new Date(Date.now()+15*86400_000).toISOString().slice(0,10);
 for(const mode of ["YOUTUBE","LIVE_CLASS"] as const){
  const title="Faculty "+mode+" scoped lifecycle "+Date.now();
  const revisedNotes="Verified "+mode+" notes persisted";
  await page.goto(base+"&advanced=1&create="+mode);
  await page.getByRole("textbox",{name:"Content Title"}).fill(title);
  if(mode==="YOUTUBE"){
   await page.getByRole("textbox",{name:"YouTube URL"}).fill("https://youtu.be/aBcDeFgHi12");
   await page.getByRole("spinbutton",{name:"Actual video duration (seconds)"}).fill("120");
  }else{
   await page.getByRole("textbox",{name:"Meeting URL"}).fill("https://meet.google.com/abc-defg-hij");
   await page.getByLabel("Starts date").fill(futureDate);
   await page.getByLabel("Ends date").fill(futureDate);
   await page.getByRole("combobox",{name:"Starts hour (12-hour clock)"}).selectOption("10");
   await page.getByRole("combobox",{name:"Ends hour (12-hour clock)"}).selectOption("11");
  }
  await page.getByRole("checkbox",{name:/Publish now/}).uncheck();
  const creating=page.waitForResponse(response=>response.request().method()==="POST"&&
   new URL(response.url()).pathname==="/api/courses/lesson-contents");
  await page.getByRole("button",{name:"Create draft"}).click();
  const created=await creating;
  expect(created.status()).toBe(200);
  const receipt=await created.json();
  const contentId:string=receipt.content?.id;
  expect(contentId).toMatch(/^[0-9a-f-]{36}$/i);
  expect(receipt.content?.status).toBe("DRAFT");
  // A separate authenticated page proves persisted readback without racing
  // the mutation page's Next.js router.refresh navigation.
  const editorPage=await context.newPage();
  try{
   await editorPage.goto(base);
   const order=editorPage.getByRole("list",{name:"Lesson content order"});
   const row=order.locator("li").filter({has:editorPage.getByRole("link",{name:title,exact:true})});
   await expect(row).toBeVisible();
   await expect(row.getByText("Draft",{exact:true})).toBeVisible();
   await expect(editorPage.getByText("E2E Section B Secret",{exact:true})).toHaveCount(0);
   await row.getByRole("button",{name:"Edit",exact:true}).click();
   const editor=editorPage.getByRole("dialog",{name:"Edit "+(mode==="YOUTUBE"?"YOUTUBE":"LIVE CLASS")});
   await expect(editor).toBeVisible();
   await editor.getByLabel("Notes").fill(revisedNotes);
   const editing=editorPage.waitForResponse(response=>response.request().method()==="PATCH"&&
    new URL(response.url()).pathname==="/api/courses/lesson-contents/"+contentId);
   await editor.getByRole("button",{name:"Save content"}).click();
   expect((await editing).status()).toBe(200);
  }finally{await editorPage.close();}
  const archivalPage=await context.newPage();
  try{
   await archivalPage.goto(base);
   const order=archivalPage.getByRole("list",{name:"Lesson content order"});
   const row=order.locator("li").filter({has:archivalPage.getByRole("link",{name:title,exact:true})});
   await expect(row).toContainText(revisedNotes);
   await row.getByRole("button",{name:"Remove "+title}).click();
   const dialog=archivalPage.getByRole("alertdialog",{name:"Remove "+title+"?"});
   await expect(dialog).toBeVisible();
   const archiving=archivalPage.waitForResponse(response=>response.request().method()==="POST"&&
    new URL(response.url()).pathname==="/api/courses/lesson-contents/"+contentId+"/transition");
   await dialog.getByRole("button",{name:"Archive item"}).click();
   const archived=await archiving;
   expect(archived.status()).toBe(200);
   const archivedReceipt=await archived.json();
   expect(archivedReceipt.content?.id).toBe(contentId);
   expect(archivedReceipt.content?.status).toBe("ARCHIVED");
  }finally{await archivalPage.close();}
  const verificationPage=await context.newPage();
  try{
   await verificationPage.goto(base);
   const order=verificationPage.getByRole("list",{name:"Lesson content order"});
   await expect(order).toBeVisible();
   await expect(order.getByRole("link",{name:title,exact:true})).toHaveCount(0);
  }finally{await verificationPage.close();}
 }
});
