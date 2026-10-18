import {randomUUID} from "node:crypto";
import {afterAll,afterEach,beforeEach,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {
 saveCollegeBranding,CollegeBrandingVersionError,
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
