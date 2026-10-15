import {randomUUID} from "node:crypto";
import {afterAll,describe,expect,it} from "vitest";
import {closeDatabaseConnection} from "@/db/client";
import {getSuperAdminCollegeReadiness} from "@/modules/colleges/readiness-service";
import type {RequestContext} from "@/modules/identity/context";
import {SEED_IDS} from "../../scripts/db-seed-data";
const enabled=Boolean(process.env.TEST_DATABASE_URL);
const context:RequestContext={user:{id:SEED_IDS.superAdminUser,identityUid:"readiness-export-superadmin",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},membership:null,adminScope:null};
describe.skipIf(!enabled)("Super Admin persisted readiness evidence scope",()=>{
 afterAll(async()=>{await closeDatabaseConnection();});
 it("reads selected college but never invents a row for unknown college",async()=>{
  const found=await getSuperAdminCollegeReadiness(context,SEED_IDS.collegeA);
  expect(found?.college.id).toBe(SEED_IDS.collegeA);
  expect(found?.evaluation.checks.length).toBeGreaterThan(0);
  expect(await getSuperAdminCollegeReadiness(context,randomUUID())).toBeNull();
 });
 it("denies absent Super Admin role",async()=>{
  await expect(getSuperAdminCollegeReadiness({...context,user:{...context.user,systemRoles:[]}},SEED_IDS.collegeA)).rejects.toBeDefined();
 });
});
