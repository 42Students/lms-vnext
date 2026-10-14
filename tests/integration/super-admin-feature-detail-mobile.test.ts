import {randomUUID} from "node:crypto";
import {Pool} from "pg";
import {afterAll,describe,expect,it} from "vitest";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {getSuperAdminCollegeModuleAccess} from "@/modules/module-access/admin-read-service";
import {SEED_IDS} from "../../scripts/db-seed-data";
const enabled=Boolean(process.env.TEST_DATABASE_URL)&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1}):null;
const actor:RequestContext={user:{id:SEED_IDS.superAdminUser,identityUid:"module-card-fixture",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
 membership:null,adminScope:null};
describe.skipIf(!enabled)("Super Admin module detail cards PostgreSQL boundary",()=>{
 afterAll(async()=>{await pool?.end();await closeDatabaseConnection();});
 it("reads own in-test college, excludes foreign scope, rejects wrong role",async()=>{
  const key=randomUUID().slice(0,10);
  const org=await pool!.query<{id:string}>("insert into organizations (name) values ($1) returning id",["Hierarchy Org "+key]);
  const college=await pool!.query<{id:string}>("insert into colleges (organization_id,name,code) values ($1,$2,$3) returning id",
   [org.rows[0]!.id,"Hierarchy College "+key,"HC"+key]);
  const id=college.rows[0]!.id;
  const own={...actor,adminScope:{organizationId:org.rows[0]!.id,collegeId:id}};
  const result=await getSuperAdminCollegeModuleAccess(own,id,{page:1});
  expect(result?.college.id).toBe(id);
  expect(result?.modules).toHaveLength(3);
  const foreign={...actor,adminScope:{organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeA}};
  await expect(getSuperAdminCollegeModuleAccess(foreign,id)).rejects.toBeInstanceOf(AuthorizationError);
  await expect(getSuperAdminCollegeModuleAccess({...actor,user:{...actor.user,systemRoles:[]}},id))
   .rejects.toBeInstanceOf(AuthorizationError);
 });
});
