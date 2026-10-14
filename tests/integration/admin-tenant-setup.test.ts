import {randomUUID} from "node:crypto";
import {Pool} from "pg";
import {afterAll,describe,expect,it} from "vitest";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {getSuperAdminCollegeReadiness} from "@/modules/colleges/readiness-service";
import {getAdminTenantDetail} from "@/modules/colleges/super-admin-directory-service";
import {AuthorizationError} from "@/modules/permissions/policy";
import {SEED_IDS} from "../../scripts/db-seed-data";
const enabled=Boolean(process.env.TEST_DATABASE_URL)&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1}):null;
const admin:RequestContext={user:{id:SEED_IDS.superAdminUser,identityUid:"tenant-onboarding-test",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},membership:null,adminScope:null};
describe.skipIf(!enabled)("Tenant onboarding readiness PG",()=>{
 afterAll(async()=>{await pool?.end();await closeDatabaseConnection();});
 it("reads only in-test selected tenant readiness, blocks foreign and wrong-role",async()=>{
  const key=randomUUID().slice(0,10);
  const org=await pool!.query<{id:string}>("insert into organizations (name) values ($1) returning id",["Onboarding "+key]);
  const college=await pool!.query<{id:string}>(
   "insert into colleges (organization_id,name,code) values ($1,$2,$3) returning id",
   [org.rows[0]!.id,"Onboarding College "+key,"OB"+key]);
  const id=college.rows[0]!.id;
  const scoped={...admin,adminScope:{organizationId:org.rows[0]!.id,collegeId:id}};
  const read=await getSuperAdminCollegeReadiness(scoped,id);
  expect(read?.college.id).toBe(id);
  expect(read?.evaluation.counts.total).toBeGreaterThan(0);
  expect((await getAdminTenantDetail(scoped,id)).id).toBe(id);
  const foreign={...admin,adminScope:{organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeA}};
  await expect(getSuperAdminCollegeReadiness(foreign,id)).rejects.toBeInstanceOf(AuthorizationError);
  await expect(getSuperAdminCollegeReadiness({...admin,user:{...admin.user,systemRoles:[]}},id))
   .rejects.toBeInstanceOf(AuthorizationError);
 });
});
