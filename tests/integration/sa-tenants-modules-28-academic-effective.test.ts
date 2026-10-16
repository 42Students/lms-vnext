import {afterAll,describe,it,expect} from "vitest";
import {closeDatabaseConnection} from "@/db/client";
import {listCollegeModuleScopeChoices} from "@/modules/module-access/admin-descendant-rule-write";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
import type {RequestContext} from "@/modules/identity/context";
const enabled=Boolean(process.env.TEST_DATABASE_URL)&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const admin:RequestContext={
 user:{id:SEED_IDS.superAdminUser,identityUid:"sa-hierarchy-count-pg",platformStatus:"ACTIVE",
  systemRoles:["SUPER_ADMIN"]},membership:null,
};
describe.skipIf(!enabled)("SA-tenants-modules-28 effective policy and student counts",()=>{
 afterAll(async()=>{await closeDatabaseConnection();});
 it("resolves the seeded college without leaking another college or inventing missing counts",async()=>{
  const rows=await listCollegeModuleScopeChoices(admin,SEED_IDS.collegeA);
  expect(rows.some(row=>row.scopeType==="DEPARTMENT"&&row.scopeId===SEED_IDS.departmentA)).toBe(true);
  expect(rows.every(row=>Number.isSafeInteger(row.studentsInScope)&&row.studentsInScope>=0)).toBe(true);
  expect(rows.every(row=>/^(On|Off) · /.test(row.placementsEffective))).toBe(true);
  expect(rows.some(row=>row.scopeId===SEED_IDS.departmentB)).toBe(false);
 });
 it("denies a mismatched selected college before any hierarchy read",async()=>{
  await expect(listCollegeModuleScopeChoices({...admin,adminScope:{
   organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeB,
  }},SEED_IDS.collegeA)).rejects.toBeDefined();
 });
});
