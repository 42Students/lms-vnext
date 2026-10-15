import {describe,expect,it} from "vitest";
import {randomUUID} from "node:crypto";
import type {RequestContext} from "@/modules/identity/context";
import {writeSuperAdminStudentRule} from "@/modules/module-access/admin-student-rule-write";
import {SEED_IDS} from "../../scripts/db-seed-data";
const context:RequestContext={user:{id:SEED_IDS.collegeAdminUser,identityUid:"test",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},membership:null};
describe.skipIf(!process.env.TEST_DATABASE_URL)("Super Admin student rule write boundaries",()=>{
 it("rejects inherited write from non-Super-Admin actors",async()=>{
  await expect(writeSuperAdminStudentRule({...context,user:{...context.user,systemRoles:[]}},SEED_IDS.collegeA,SEED_IDS.learnerCollegeAMembership,{action:"INHERIT",module:"projects"})).rejects.toBeDefined();
 });
 it("does not permit non-Super-Admin actors",async()=>{
  await expect(writeSuperAdminStudentRule({...context,user:{...context.user,systemRoles:[]}},SEED_IDS.collegeA,SEED_IDS.learnerCollegeAMembership,{action:"SET",module:"projects",enabled:true,locked:false})).rejects.toBeDefined();
 });
 it("does not permit locked writes to non-member modules",async()=>{
  await expect(writeSuperAdminStudentRule(context,SEED_IDS.collegeA,SEED_IDS.learnerCollegeAMembership,{action:"SET",module:"placements",enabled:false,locked:true})).rejects.toBeDefined();
 });
 it("does not mutate unknown or foreign student membership",async()=>{
  expect(await writeSuperAdminStudentRule(context,SEED_IDS.collegeA,randomUUID(),{action:"SET",module:"projects",enabled:false,locked:false})).toBeNull();
 });
});
