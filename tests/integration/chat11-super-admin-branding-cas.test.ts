import {randomUUID} from "node:crypto";
import {afterAll,afterEach,beforeEach,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {
 saveCollegeBranding,CollegeBrandingVersionError,getPublicCollegeBranding,getCollegeBranding,
} from "@/modules/colleges/branding-service";
import {SEED_IDS} from "../../scripts/db-seed-data";

const databaseUrl=process.env.TEST_DATABASE_URL;
if(!databaseUrl)throw new Error("Chat-11 branding CAS integration requires disposable TEST_DATABASE_URL");
const pool=new Pool({connectionString:databaseUrl,max:2});
const context:RequestContext={
 user:{id:SEED_IDS.superAdminUser,identityUid:"seed-superadmin",
  platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
 membership:null,adminScope:null,
};
let collegeId:string;

async function countChanges(){
 const result=await pool.query<{total:string}>(
  "select count(*)::text as total from activity_events where college_id=$1 and event_type='platform.college.branding_updated'",
  [collegeId]);
 return Number(result.rows[0]?.total??"0");
}

beforeEach(async()=>{
 collegeId=randomUUID();
 await pool.query(
  "insert into colleges(id,organization_id,name,code,status) values ($1,$2,$3,$4,'ACTIVE')",
  [collegeId,SEED_IDS.organization,"Chat11 CAS test", "chat11-"+collegeId.slice(0,8)]);
});
afterEach(async()=>{
 await pool.query(
  "delete from in_app_notifications where event_id in (select id from activity_events where college_id=$1)",
  [collegeId]);
 await pool.query("delete from activity_events where college_id=$1",[collegeId]);
 await pool.query("delete from college_branding where college_id=$1",[collegeId]);
 await pool.query("delete from colleges where id=$1",[collegeId]);
});
afterAll(async()=>{await pool.end();await closeDatabaseConnection();});

describe("SA-tenants-modules-BRAND-CAS-01 PostgreSQL stale tab protection",()=>{
 it("a lost-response retry is a no-op: one persisted row, one audit event, unchanged version",async()=>{
  const wanted={expectedVersion:0,primaryColor:"#AABBCC"};
  const first=await saveCollegeBranding(context,collegeId,wanted);
  expect(first.version).toBe(1);
  expect(first.primaryColor).toBe("#AABBCC");
  expect(await countChanges()).toBe(1);
  const repeat=await saveCollegeBranding(context,collegeId,wanted);
  expect(repeat).toEqual(first);
  expect(await countChanges()).toBe(1);
 });
 it("a genuinely different stale tab cannot overwrite a newer saved brand",async()=>{
  await saveCollegeBranding(context,collegeId,{expectedVersion:0,primaryColor:"#AABBCC"});
  await expect(saveCollegeBranding(context,collegeId,{
   expectedVersion:0,primaryColor:"#DDEEFF",
  })).rejects.toBeInstanceOf(CollegeBrandingVersionError);
  const query=await pool.query<{primary_color:string;version:number}>(
   "select primary_color,version from college_branding where college_id=$1",[collegeId]);
  expect(query.rows[0]).toMatchObject({primary_color:"#AABBCC",version:1});
  expect(await countChanges()).toBe(1);
 });
 it("two simultaneous writes against one version have exactly one winner",async()=>{
  await saveCollegeBranding(context,collegeId,{expectedVersion:0,primaryColor:"#AABBCC"});
  const results=await Promise.allSettled([
   saveCollegeBranding(context,collegeId,{expectedVersion:1,primaryColor:"#112233"}),
   saveCollegeBranding(context,collegeId,{expectedVersion:1,primaryColor:"#445566"}),
  ]);
  expect(results.filter(row=>row.status==="fulfilled")).toHaveLength(1);
  const rejected=results.find(row=>row.status==="rejected");
  expect(rejected?.status).toBe("rejected");
  if(rejected?.status==="rejected")
   expect(rejected.reason).toBeInstanceOf(CollegeBrandingVersionError);
  expect(await countChanges()).toBe(2);
  const query=await pool.query<{version:number;primary_color:string}>(
   "select version,primary_color from college_branding where college_id=$1",[collegeId]);
  expect(query.rows[0]?.version).toBe(2);
  expect(["#112233","#445566"]).toContain(query.rows[0]?.primary_color);
 });

 it("round-trips every active legacy presentation field without leaking private branding metadata",async()=>{
  const payload={
   expectedVersion:0,
   logoUrl:"https://assets.example.test/college-logo.png",
   faviconUrl:"https://assets.example.test/favicon.ico",
   loginBackgroundUrl:"https://assets.example.test/login-desktop.webp",
   loginBackgroundUrlMobile:"https://assets.example.test/login-mobile.webp",
   primaryColor:"#AABBCC",secondaryColor:"#112233",
   supportEmail:"helpdesk@example.test",supportPhone:"+91 98765 43210",
   termsUrl:"https://assets.example.test/terms",
   privacyUrl:"https://assets.example.test/privacy",
  };
  const saved=await saveCollegeBranding(context,collegeId,payload);
  const {expectedVersion: _expectedVersion, ...fields}=payload;
  expect(saved).toMatchObject({...fields,version:1});
  const direct=await pool.query<{
   college_id:string;logo_url:string;favicon_url:string;
   login_background_url:string;login_background_url_mobile:string;
   primary_color:string;secondary_color:string;support_email:string;
   support_phone:string;terms_url:string;privacy_url:string;
   version:number;created_at:Date;updated_at:Date;
  }>("select * from college_branding where college_id=$1",[collegeId]);
  expect(direct.rowCount).toBe(1);
  const actual=direct.rows[0]!;
  expect(actual.college_id).toBe(collegeId);
  expect(actual.logo_url).toBe(payload.logoUrl);
  expect(actual.favicon_url).toBe(payload.faviconUrl);
  expect(actual.login_background_url).toBe(payload.loginBackgroundUrl);
  expect(actual.login_background_url_mobile).toBe(payload.loginBackgroundUrlMobile);
  expect(actual.primary_color).toBe(payload.primaryColor);
  expect(actual.secondary_color).toBe(payload.secondaryColor);
  expect(actual.support_email).toBe(payload.supportEmail);
  expect(actual.support_phone).toBe(payload.supportPhone);
  expect(actual.terms_url).toBe(payload.termsUrl);
  expect(actual.privacy_url).toBe(payload.privacyUrl);
  expect(actual.version).toBe(1);
  expect(actual.created_at).toBeInstanceOf(Date);
  expect(actual.updated_at).toBeInstanceOf(Date);
  const publicView=await getPublicCollegeBranding(collegeId);
  expect(publicView).toMatchObject({
   logoUrl:payload.logoUrl,faviconUrl:payload.faviconUrl,
   loginBackgroundUrl:payload.loginBackgroundUrl,
   loginBackgroundUrlMobile:payload.loginBackgroundUrlMobile,
   primaryColor:payload.primaryColor,secondaryColor:payload.secondaryColor,
   supportEmail:payload.supportEmail,supportPhone:payload.supportPhone,
   termsUrl:payload.termsUrl,privacyUrl:payload.privacyUrl,
  });
  expect(publicView).not.toHaveProperty("version");
  expect(publicView).not.toHaveProperty("collegeId");
  expect(publicView).not.toHaveProperty("legacyBrandingId");
  expect(await countChanges()).toBe(1);
 });

 it("hides branding and rejects writes when the owning organization becomes archived",async()=>{
  const ownOrg=randomUUID(),ownCollege=randomUUID();
  try{
   await pool.query("insert into organizations(id,name,status) values ($1,$2,'ACTIVE')",
    [ownOrg,"DB004 archived-branding org "+ownOrg]);
   await pool.query(
    "insert into colleges(id,organization_id,name,code,status) values($1,$2,'Archived parent branding',$3,'ACTIVE')",
    [ownCollege,ownOrg,"brand"+ownCollege.slice(0,8)]);
   await saveCollegeBranding(context,ownCollege,{expectedVersion:0,
    supportEmail:"active@example.test"});
   expect(await getPublicCollegeBranding(ownCollege)).toMatchObject({
    supportEmail:"active@example.test",
   });
   await pool.query("update organizations set status='ARCHIVED' where id=$1",[ownOrg]);
   await expect(getPublicCollegeBranding(ownCollege)).resolves.toBeNull();
   await expect(saveCollegeBranding(context,ownCollege,{
    expectedVersion:1,supportEmail:"unauthorized@example.test",
   })).rejects.toThrow("COLLEGE_NOT_FOUND");
   const stored=await pool.query<{support_email:string}>(
    "select support_email from college_branding where college_id=$1",[ownCollege]);
   expect(stored.rows[0]?.support_email).toBe("active@example.test");
  }finally{
   await pool.query("delete from in_app_notifications where event_id in (select id from activity_events where college_id=$1)",[ownCollege]);
   await pool.query("delete from activity_events where college_id=$1",[ownCollege]);
   await pool.query("delete from college_branding where college_id=$1",[ownCollege]);
   await pool.query("delete from colleges where id=$1",[ownCollege]);
   await pool.query("delete from organizations where id=$1",[ownOrg]);
  }
 });

 it("keeps imported deleted branding hidden and blocks accidental resurrection",async()=>{
  await saveCollegeBranding(context,collegeId,{
   expectedVersion:0,logoUrl:"https://assets.example.test/old-private-logo.png",
   supportEmail:"old-contact@example.test",
  });
  expect(await countChanges()).toBe(1);
  await pool.query(
   `update college_branding set legacy_was_deleted=true,
       legacy_branding_archived_at=clock_timestamp() where college_id=$1`,
   [collegeId]);
  const publicBrand=await getPublicCollegeBranding(collegeId);
  expect(publicBrand).toMatchObject({logoUrl:null,supportEmail:null});
  expect(JSON.stringify(publicBrand)).not.toContain("old-contact@example.test");
  expect(JSON.stringify(publicBrand)).not.toContain("old-private-logo.png");
  const adminBrand=await getCollegeBranding(context,collegeId);
  expect(adminBrand).toMatchObject({logoUrl:null,supportEmail:null,version:1});
  await expect(saveCollegeBranding(context,collegeId,{
   expectedVersion:1,logoUrl:"https://assets.example.test/revived.png",
  })).rejects.toThrow("COLLEGE_NOT_FOUND");
  const stored=await pool.query<{
   legacy_was_deleted:boolean;legacy_branding_archived_at:Date;
   logo_url:string;support_email:string;version:number;
  }>("select * from college_branding where college_id=$1",[collegeId]);
  expect(stored.rows[0]).toMatchObject({
   legacy_was_deleted:true,logo_url:"https://assets.example.test/old-private-logo.png",
   support_email:"old-contact@example.test",version:1,
  });
  expect(stored.rows[0]?.legacy_branding_archived_at).toBeInstanceOf(Date);
  expect(await countChanges()).toBe(1);
 });

 it("wrong-tenant scoped Super Admin and disabled actor never write branding",async()=>{
  const actors:RequestContext[]=[
   {...context,adminScope:{organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeA}},
   {...context,user:{...context.user,platformStatus:"DISABLED"}},
  ];
  for(const actor of actors){
   await expect(saveCollegeBranding(actor,collegeId,{
    expectedVersion:0,primaryColor:"#112233",
   })).rejects.toThrow();
  }
  const query=await pool.query<{total:string}>(
   "select count(*)::text as total from college_branding where college_id=$1",
   [collegeId]);
  expect(Number(query.rows[0]?.total??"0")).toBe(0);
  expect(await countChanges()).toBe(0);
 });
});
