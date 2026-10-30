import {randomUUID} from "node:crypto";
import {Pool} from "pg";
import {expect,test,type BrowserContext} from "@playwright/test";
import {E2E_IDENTITY_COOKIE_NAME,E2E_SECRET_COOKIE_NAME} from "../../src/auth/e2e-identity";
import {SEED_IDS} from "../../scripts/db-seed-data";

const BASE="http://localhost:3000";
const secret=process.env.E2E_AUTH_SECRET;
const databaseUrl=process.env.E2E_DATABASE_URL;
test.skip(!secret||!databaseUrl||process.env.E2E_AUTH_ENABLED!=="true",
 "Faculty self-profile browser acceptance requires explicitly disposable E2E PostgreSQL");

async function facultyLogin(context:BrowserContext,identityUid:string,membershipId:string){
 await context.addCookies([
  {name:"lms_role",value:"FACULTY",url:BASE,httpOnly:true,sameSite:"Lax"},
  {name:E2E_IDENTITY_COOKIE_NAME,value:identityUid,url:BASE,httpOnly:true,sameSite:"Lax"},
  {name:E2E_SECRET_COOKIE_NAME,value:secret!,url:BASE,httpOnly:true,sameSite:"Lax"},
  {name:"lms_membership",value:membershipId,url:BASE,httpOnly:true,sameSite:"Lax"},
 ]);
}

for(const view of [{name:"desktop",width:1280,height:800},{name:"mobile",width:390,height:844}]){
 test("Faculty-only Profile self-edit, persistence, stale denial and privacy on "+view.name,
 async({page,context})=>{
  test.setTimeout(120_000);
  const pool=new Pool({connectionString:databaseUrl!,max:1});
  const userId=randomUUID(),membershipId=randomUUID(),roleId=randomUUID();
  const identityUid="faculty-profile-e2e-"+randomUUID();
  let seeded=false;
  try{
   // The shared seed Faculty is ALSO a Mentor; it is intentionally rejected
   // by the Faculty-only profile policy. Use an isolated authorized member
   // instead of making production permissions less strict for this test.
   await pool.query(
    "insert into users(id,identity_uid,email,display_name,platform_status) values ($1,$2,$3,$4,'ACTIVE')",
    [userId,identityUid,identityUid+"@example.invalid","Faculty Profile Acceptance"],
   );
   seeded=true;
   await pool.query(
    "insert into college_memberships(id,user_id,college_id,status) values ($1,$2,$3,'ACTIVE')",
    [membershipId,userId,SEED_IDS.collegeA],
   );
   await pool.query(
    "insert into membership_roles(id,membership_id,role) values ($1,$2,'FACULTY')",
    [roleId,membershipId],
   );
   await facultyLogin(context,identityUid,membershipId);
   await page.setViewportSize({width:view.width,height:view.height});
   const errors:string[]=[];
   page.on("pageerror",error=>errors.push(error.message));
   await page.goto("/teacher/profile");
   await expect(page.getByRole("heading",{name:"Profile",level:1})).toBeVisible();
   await expect(page.getByRole("region",{name:"Full faculty profile"})).toBeVisible();
   await expect(page.getByText("Profile editing unavailable")).toHaveCount(0);
   const editor=page.getByRole("form",{name:"About"});
   await expect(editor).toBeVisible();
   for(const name of ["Personal Details","Experience","Education/Qualification",
    "Certifications","Languages","Publications & Research","Awards & Recognitions",
    "Social Profiles","Address"]){
    await expect(page.getByRole("form",{name})).toHaveCount(1);
   }
   const initial=await page.evaluate(async()=>{
    const response=await fetch("/api/people/faculty-self-document");
    return {status:response.status,body:await response.json()};
   });
   expect(initial.status).toBe(200);
   const oldVersion:number=initial.body.version;
   const marker="Faculty account closure proof "+randomUUID().slice(0,10);
   await editor.getByRole("textbox",{name:"About me"}).fill(marker);
   const saving=page.waitForResponse(response=>response.request().method()==="PATCH" &&
    new URL(response.url()).pathname==="/api/people/faculty-self-document");
   await editor.getByRole("button",{name:"Save About"}).click();
   expect((await saving).status()).toBe(200);
   await expect(page.getByText("Updated successfully!",{exact:true})).toBeVisible();
   await page.reload();
   await expect(page.getByRole("form",{name:"About"})
    .getByRole("textbox",{name:"About me"})).toHaveValue(marker);
   const stale=await page.evaluate(async(version)=>{
    const response=await fetch("/api/people/faculty-self-document",{
     method:"PATCH",headers:{"Content-Type":"application/json"},
     body:JSON.stringify({section:"about",value:{description:"stale overwrite"},expectedVersion:version}),
    });
    return response.status;
   },oldVersion);
   expect(stale).toBe(409);
   const afterStale=await page.evaluate(async()=>{
    const response=await fetch("/api/people/faculty-self-document");
    return {status:response.status,body:await response.json()};
   });
   expect(afterStale.status).toBe(200);
   expect(afterStale.body.document.about.description).toBe(marker);
   if(view.name==="mobile"){
    const width=await page.evaluate(()=>document.documentElement.scrollWidth);
    expect(width).toBeLessThanOrEqual(view.width+1);
   }
   expect(errors).toEqual([]);
  }finally{
   // Only this fixture's rows. A disposable E2E database is mandatory; never
   // mutate real Faculty roles or leave test profile edits on shared users.
   if(seeded){
    await pool.query("delete from faculty_profiles where membership_id=$1",[membershipId]);
    await pool.query("delete from membership_roles where membership_id=$1",[membershipId]);
    await pool.query("delete from college_memberships where id=$1",[membershipId]);
    await pool.query("delete from users where id=$1",[userId]);
   }
   await pool.end();
  }
 });
}
