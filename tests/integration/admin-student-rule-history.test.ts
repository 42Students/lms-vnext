import {describe,expect,it} from "vitest";
import {randomUUID} from "node:crypto";
import type {RequestContext} from "@/modules/identity/context";
import {listSuperAdminStudentRuleHistory} from "@/modules/module-access/admin-student-rule-history-service";
import {SEED_IDS} from "../../scripts/db-seed-data";
const actor:RequestContext={user:{id:SEED_IDS.collegeAdminUser,identityUid:"seed",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},membership:null};
describe.skipIf(!process.env.TEST_DATABASE_URL)("Student rule history scope",()=>{
 it("does not disclose foreign or unknown learner history",async()=>{
  expect(await listSuperAdminStudentRuleHistory(actor,SEED_IDS.collegeA,randomUUID())).toBeNull();
  expect(await listSuperAdminStudentRuleHistory(actor,SEED_IDS.collegeB,SEED_IDS.learnerCollegeAMembership)).toBeNull();
 });
 it("denies a non-admin actor",async()=>{
  await expect(listSuperAdminStudentRuleHistory({...actor,user:{...actor.user,systemRoles:[]}},SEED_IDS.collegeA,SEED_IDS.learnerCollegeAMembership)).rejects.toBeDefined();
 });
});
