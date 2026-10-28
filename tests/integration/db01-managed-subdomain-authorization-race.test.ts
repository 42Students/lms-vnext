import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { changeManagedCollegeSubdomain } from "@/modules/tenant-domains/managed-subdomain-service";
import { SEED_IDS } from "../../scripts/db-seed-data";

const url=process.env.TEST_DATABASE_URL;
if(!url||process.env.DATABASE_URL!==url)
  throw new Error("Managed domain acceptance requires disposable DATABASE_URL === TEST_DATABASE_URL");
const pool=new Pool({connectionString:url,max:3});
const suffix=randomUUID().slice(0,8);
const orgId=randomUUID(),collegeA=randomUUID(),collegeB=randomUUID(),staleActorId=randomUUID();
const base="db004-managed.example.test";
const priorBase=process.env.TENANT_MANAGED_BASE_DOMAIN;
const priorReady=process.env.TENANT_MANAGED_WILDCARD_READY;
const superAdmin:RequestContext={
 user:{id:SEED_IDS.superAdminUser,identityUid:"db004-seeded-superadmin",
  platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},membership:null,
};
const staleAdmin:RequestContext={
 user:{id:staleActorId,identityUid:"db004-stale-admin",
  platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},membership:null,
};
const label="m"+suffix;

beforeAll(async()=>{
 process.env.TENANT_MANAGED_BASE_DOMAIN=base;
 process.env.TENANT_MANAGED_WILDCARD_READY="true";
 await pool.query("insert into organizations (id,name,status) values ($1,$2,'ACTIVE')",
  [orgId,"DB004 managed host "+orgId]);
 await pool.query(
  "insert into colleges (id,organization_id,name,code,status) values ($1,$2,'Managed A',$3,'ACTIVE'),($4,$2,'Managed B',$5,'ACTIVE')",
  [collegeA,orgId,"DB004A"+suffix,collegeB,"DB004B"+suffix]);
 await pool.query("insert into users (id,identity_uid,platform_status) values ($1,$2,'ACTIVE')",
  [staleActorId,"db004-fake-global-"+staleActorId]);
});
beforeEach(async()=>{
 await pool.query("delete from activity_events where college_id=any($1::uuid[])",[[collegeA,collegeB]]);
 await pool.query("delete from tenant_domains where college_id=any($1::uuid[])",[[collegeA,collegeB]]);
});
afterAll(async()=>{
 if(priorBase===undefined)delete process.env.TENANT_MANAGED_BASE_DOMAIN;
 else process.env.TENANT_MANAGED_BASE_DOMAIN=priorBase;
 if(priorReady===undefined)delete process.env.TENANT_MANAGED_WILDCARD_READY;
 else process.env.TENANT_MANAGED_WILDCARD_READY=priorReady;
 await pool.query("delete from activity_events where college_id=any($1::uuid[])",[[collegeA,collegeB]]);
 await pool.query("delete from tenant_domains where college_id=any($1::uuid[])",[[collegeA,collegeB]]);
 await pool.query("delete from colleges where id=any($1::uuid[])",[[collegeA,collegeB]]);
 await pool.query("delete from organizations where id=$1",[orgId]);
 await pool.query("delete from users where id=$1",[staleActorId]);
 await pool.end();
 await closeDatabaseConnection();
});

describe("DB-004 managed hostname ownership",()=>{
 it("allots a verified managed hostname with a real persisted privileged actor",async()=>{
  const outcome=await changeManagedCollegeSubdomain(superAdmin,collegeA,{
   action:"ALLOT",label,expectedHost:null,
  });
  expect(outcome).toMatchObject({host:label+"."+base,changed:true});
  const rows=await pool.query<{is_primary:boolean;is_verified:boolean}>(
   "select is_primary,is_verified from tenant_domains where college_id=$1",[collegeA]);
  expect(rows.rows).toEqual([{is_primary:true,is_verified:true}]);
 });

 it("blocks a forged or revoked global admin snapshot before mutation",async()=>{
  await expect(changeManagedCollegeSubdomain(staleAdmin,collegeA,{
   action:"ALLOT",label,expectedHost:null,
  })).rejects.toBeInstanceOf(AuthorizationError);
  const rows=await pool.query("select id from tenant_domains where college_id=$1",[collegeA]);
  expect(rows.rowCount).toBe(0);
 });

 it("rejects managed addresses under an archived parent organization",async()=>{
  await pool.query("update organizations set status='ARCHIVED' where id=$1",[orgId]);
  try{
   await expect(changeManagedCollegeSubdomain(superAdmin,collegeA,{
    action:"ALLOT",label,expectedHost:null,
   })).rejects.toMatchObject({code:"COLLEGE_NOT_FOUND"});
  }finally{
   await pool.query("update organizations set status='ACTIVE' where id=$1",[orgId]);
  }
 });

 it("serializes simultaneous cross-college claims to a single hostname",async()=>{
  const outcomes=await Promise.allSettled([
   changeManagedCollegeSubdomain(superAdmin,collegeA,{action:"ALLOT",label,expectedHost:null}),
   changeManagedCollegeSubdomain(superAdmin,collegeB,{action:"ALLOT",label,expectedHost:null}),
  ]);
  expect(outcomes.filter(outcome=>outcome.status==="fulfilled")).toHaveLength(1);
  expect(outcomes.filter(outcome=>outcome.status==="rejected")).toHaveLength(1);
  const count=await pool.query<{count:string}>(
   "select count(*)::text as count from tenant_domains where host=$1",[label+"."+base]);
  expect(Number(count.rows[0]?.count)).toBe(1);
 });
});
