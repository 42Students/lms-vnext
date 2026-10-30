import { randomUUID } from "node:crypto";
import { expect, test, type BrowserContext } from "@playwright/test";
import { E2E_IDENTITY_COOKIE_NAME, E2E_SECRET_COOKIE_NAME } from "../../src/auth/e2e-identity";
import { SEED_IDS } from "../../scripts/db-seed-data";

const secret=process.env.E2E_AUTH_SECRET;
test.skip(!secret || process.env.E2E_AUTH_ENABLED!=="true",
  "Faculty whole-account profile acceptance requires disposable E2E auth and PostgreSQL");

async function facultyLogin(context:BrowserContext){
 await context.addCookies([
  {name:"lms_role",value:"FACULTY",url:"http://localhost:3000",httpOnly:true,sameSite:"Lax"},
  {name:E2E_IDENTITY_COOKIE_NAME,value:"seed-shared-faculty",url:"http://localhost:3000",httpOnly:true,sameSite:"Lax"},
  {name:E2E_SECRET_COOKIE_NAME,value:secret!,url:"http://localhost:3000",httpOnly:true,sameSite:"Lax"},
  {name:"lms_membership",value:SEED_IDS.facultyCollegeAMembership,url:"http://localhost:3000",httpOnly:true,sameSite:"Lax"},
 ]);
}

for(const view of [{name:"desktop",width:1280,height:800},{name:"mobile",width:390,height:844}]){
 test("Faculty Profile self-edit, persistence, stale denial and private scope on "+view.name,
  async({page,context})=>{
   test.setTimeout(120_000);
   await facultyLogin(context);
   await page.setViewportSize({width:view.width,height:view.height});
   const errors:string[]=[];
   page.on("pageerror",error=>errors.push(error.message));
   await page.goto("/teacher/profile");
   await expect(page.getByRole("heading",{name:"Profile",level:1})).toBeVisible();
   await expect(page.getByRole("region",{name:"Full faculty profile"})).toBeVisible();
   // If the migration is missing, this is a real blocker, not a skipped test.
   await expect(page.getByText("Profile editing unavailable")).toHaveCount(0);
   const editor=page.getByRole("form",{name:"About"});
   await expect(editor).toBeVisible();
   for(const name of ["Personal Details","Experience","Education/Qualification",
    "Certifications","Languages","Publications & Research","Awards & Recognitions",
    "Social Profiles","Address"]){
     await expect(page.getByRole("form",{name})).toHaveCount(1);
   }
   const initialResponse=await page.evaluate(async()=>{
    const response=await fetch("/api/people/faculty-self-document");
    return {status:response.status,body:await response.json()};
   });
   expect(initialResponse.status).toBe(200);
   const originalSections={
    about:initialResponse.body.document.about,
    contact:initialResponse.body.document.contact,
    address:initialResponse.body.document.address,
    socialProfiles:initialResponse.body.document.socialProfiles,
   };
   const oldVersion:number=initialResponse.body.version;
   const marker="Faculty account closure proof "+randomUUID().slice(0,10);
   try{
    await editor.getByRole("textbox",{name:"About me"}).fill(marker);
    const saving=page.waitForResponse(response=>response.request().method()==="PATCH" &&
      new URL(response.url()).pathname==="/api/people/faculty-self-document");
    await editor.getByRole("button",{name:"Save About"}).click();
    expect((await saving).status()).toBe(200);
    await expect(page.getByText("Updated successfully!",{exact:true})).toBeVisible();
    await page.reload();
    await expect(page.getByRole("form",{name:"About"})
      .getByRole("textbox",{name:"About me"})).toHaveValue(marker);
    const stale=await page.evaluate(async({version})=>{
     const response=await fetch("/api/people/faculty-self-document",{
      method:"PATCH",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({section:"about",value:{description:"stale overwrite"},expectedVersion:version}),
     });
     return response.status;
    },{version:oldVersion});
    expect(stale).toBe(409);
    const afterStale=await page.evaluate(async()=>{
     const response=await fetch("/api/people/faculty-self-document");
     return {status:response.status,body:await response.json()};
    });
    expect(afterStale.status).toBe(200);
    expect(afterStale.body.document.about.description).toBe(marker);
    // Exercise actual browser forms, not only direct service calls. Each
    // Section persists independently and reloads its confirmed version.
    for(const row of [
     {form:"Contacts",field:"Primary mobile",section:"contact",key:"contactMobile",value:"9876543219"},
     {form:"Address",field:"Current city",section:"address",key:"currentCity",value:"Hyderabad"},
     {form:"Social Profiles",field:"LinkedIn",section:"socialProfiles",key:"linkedIn",value:"https://www.linkedin.com/in/faculty-acceptance"},
    ]){
     const form=page.getByRole("form",{name:row.form});
     await form.getByRole("textbox",{name:row.field}).fill(row.value);
     const saved=page.waitForResponse(response=>response.request().method()==="PATCH" &&
      new URL(response.url()).pathname==="/api/people/faculty-self-document");
     await form.getByRole("button",{name:"Save "+row.form}).click();
     expect((await saved).status()).toBe(200);
     await page.reload();
     await expect(page.getByRole("form",{name:row.form}).getByRole("textbox",{name:row.field}))
      .toHaveValue(row.value);
     const persisted=await page.evaluate(async(section)=>{
      const response=await fetch("/api/people/faculty-self-document?section="+encodeURIComponent(section));
      return {status:response.status,body:await response.json()};
     },row.section);
     expect(persisted.status).toBe(200);
     expect(persisted.body.value[row.key]).toBe(row.value);
    }
    if(view.name==="mobile"){
     const width=await page.evaluate(()=>document.documentElement.scrollWidth);
     expect(width).toBeLessThanOrEqual(view.width+1);
    }
    expect(errors).toEqual([]);
   } finally {
    // The seed identity is shared by other suites. Restore its initial
    // persisted value even if an assertion fails after the mutation.
    const restored=await page.evaluate(async(snapshots)=>{
      for(const [section,value] of Object.entries(snapshots)){
       const read=await fetch("/api/people/faculty-self-document");
       if(!read.ok)return read.status;
       const body=await read.json();
       if(JSON.stringify(body.document[section])===JSON.stringify(value))continue;
       const response=await fetch("/api/people/faculty-self-document",{
        method:"PATCH",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({section,value,expectedVersion:body.version}),
       });
       if(!response.ok)return response.status;
      }
      return 200;
    },originalSections).catch(()=>0);
    expect(restored).toBe(200);
   }
  });
}
