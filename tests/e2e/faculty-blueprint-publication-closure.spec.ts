import {expect,test,type BrowserContext} from "@playwright/test";
import {E2E_IDENTITY_COOKIE_NAME,E2E_SECRET_COOKIE_NAME} from "../../src/auth/e2e-identity";
import {SEED_IDS} from "../../scripts/db-seed-data";

const secret=process.env.E2E_AUTH_SECRET;
test.skip(!secret||process.env.E2E_AUTH_ENABLED!=="true"||!process.env.E2E_DATABASE_URL,
 "Faculty-to-learner visibility needs explicitly disposable authenticated PostgreSQL");

async function authenticate(context:BrowserContext,role:"FACULTY"|"LEARNER"){
 await context.addCookies([
  {name:"lms_role",value:role,url:"http://localhost:3000",httpOnly:true,sameSite:"Lax"},
  {name:E2E_IDENTITY_COOKIE_NAME,value:role==="FACULTY"?"seed-shared-faculty":"seed-learner",
   url:"http://localhost:3000",httpOnly:true,sameSite:"Lax"},
  {name:E2E_SECRET_COOKIE_NAME,value:secret!,url:"http://localhost:3000",httpOnly:true,sameSite:"Lax"},
  {name:"lms_membership",value:role==="FACULTY"?SEED_IDS.facultyCollegeAMembership:
    SEED_IDS.learnerCollegeAMembership,url:"http://localhost:3000",httpOnly:true,sameSite:"Lax"},
 ]);
}

test("Faculty published Section Resource becomes visible to enrolled learner and disappears after archive",async({page,context,browser})=>{
 test.setTimeout(150_000);
 await authenticate(context,"FACULTY");
 await page.goto("/teacher/courses");
 await page.getByRole("link",{name:/E2E Browser Course/}).first().click();
 // Playwright click completion does not guarantee Next.js route hydration has settled.
 // Read the Section ID only after the canonical authorized course URL is current.
 await expect(page).toHaveURL(/\/teacher\/courses\/[0-9a-f-]{36}\/home$/i);
 const deliveryId=new URL(page.url()).pathname.split("/")[3]!;
 await page.getByRole("navigation",{name:"Faculty course tabs"})
  .getByRole("link",{name:"Blueprint"}).click();
 const explorer=page.getByRole("region",{name:"Course blueprint lesson explorer"});
 const selected=explorer.getByRole("complementary").getByRole("link",{current:"page"});
 const lessonId=new URL((await selected.getAttribute("href"))!,page.url()).searchParams.get("lesson");
 expect(lessonId).toMatch(/^[0-9a-f-]{36}$/i);
 const title="Faculty published Resource lifecycle "+Date.now();
 await page.goto("/teacher/courses/"+deliveryId+"/blueprint?lesson="+lessonId+"&advanced=1&create=RESOURCE");
 await page.getByRole("textbox",{name:"Content Title"}).fill(title);
 await page.getByRole("textbox",{name:"Notes (optional)"}).fill("Approved text-only Section resource");
 await expect(page.getByRole("checkbox",{name:/Publish now/})).toBeChecked();
 const creating=page.waitForResponse(response=>response.request().method()==="POST"&&
  new URL(response.url()).pathname==="/api/courses/lesson-contents");
 const publishing=page.waitForResponse(response=>response.request().method()==="POST"&&
  /^\/api\/courses\/lesson-contents\/[0-9a-f-]{36}\/transition$/i.test(new URL(response.url()).pathname));
 await page.getByRole("button",{name:"Create draft"}).click();
 const created=await creating;
 expect(created.status()).toBe(200);
 const id:string=(await created.json()).content?.id;
 expect(id).toMatch(/^[0-9a-f-]{36}$/i);
 const published=await publishing;
 expect(published.status()).toBe(200);
 const pubReceipt=await published.json();
 expect(pubReceipt.content?.id).toBe(id);
 expect(pubReceipt.content?.status).toBe("PUBLISHED");

 const learnerContext=await browser.newContext();
 try{
  await authenticate(learnerContext,"LEARNER");
  const learner=await learnerContext.newPage();
  await learner.goto("http://localhost:3000/learn/courses");
  const read=async()=>{
   return learner.evaluate(async({lessonId,deliveryId})=>{
    const response=await fetch("/api/courses/lesson-contents?lessonId="+
     encodeURIComponent(lessonId)+"&deliveryId="+encodeURIComponent(deliveryId),
     {cache:"no-store"});
    return {status:response.status,body:await response.json()};
   },{lessonId:lessonId!,deliveryId});
  };
  const visible=await read();
  expect(visible.status).toBe(200);
  expect(visible.body.contents.some((row:{id:string;status:string})=>row.id===id&&row.status==="PUBLISHED")).toBe(true);

  const archived=await page.evaluate(async(contentId)=>{
   const response=await fetch("/api/courses/lesson-contents/"+contentId+"/transition",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({action:"ARCHIVE"}),
   });
   return {status:response.status,body:await response.json()};
  },id);
  expect(archived.status).toBe(200);
  expect(archived.body.content?.id).toBe(id);
  expect(archived.body.content?.status).toBe("ARCHIVED");
  const hidden=await read();
  expect(hidden.status).toBe(200);
  expect(hidden.body.contents.some((row:{id:string})=>row.id===id)).toBe(false);
 }finally{await learnerContext.close();}
});
