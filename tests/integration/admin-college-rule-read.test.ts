import {describe,it,expect} from "vitest";
import {randomUUID} from "node:crypto";
import {getSuperAdminCollegeFeatureSnapshot} from "@/modules/module-access/admin-college-rule-read";
import {SEED_IDS} from "../../scripts/db-seed-data";
import type {RequestContext} from "@/modules/identity/context";
const admin:RequestContext={user:{id:SEED_IDS.collegeAdminUser,identityUid:"super",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},membership:null};
describe.skipIf(!process.env.TEST_DATABASE_URL)("Super Admin scoped college feature recheck",()=>{
 it("rejects wrong role, unknown college and returns only three stored values",async()=>{
  await expect(getSuperAdminCollegeFeatureSnapshot({...admin,user:{...admin.user,systemRoles:[]}},SEED_IDS.collegeA)).rejects.toBeDefined();
  expect(await getSuperAdminCollegeFeatureSnapshot(admin,randomUUID())).toBeNull();
  const valid=await getSuperAdminCollegeFeatureSnapshot(admin,SEED_IDS.collegeA);
  expect(valid?.rules).toHaveLength(3);
  expect(JSON.stringify(valid)).not.toContain("email");
  const foreign=await getSuperAdminCollegeFeatureSnapshot({...admin,adminScope:{organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeB}},SEED_IDS.collegeA);
  expect(foreign).toBeNull();
 });
});