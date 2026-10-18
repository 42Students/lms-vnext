import {afterAll,describe,expect,it} from "vitest";
import {randomUUID} from "node:crypto";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {readTpoLearnerPrepOutcomes} from "@/modules/placements/tpo-prep-readiness-derived-service";
import {SEED_IDS} from "../../scripts/db-seed-data";

if(!process.env.TEST_DATABASE_URL)
 throw new Error("TPO preparation-scope tests require disposable TEST_DATABASE_URL");
const admin:RequestContext={
 user:{id:SEED_IDS.collegeAdminUser,identityUid:"seed-college-admin",
  platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.collegeAdminMembership,collegeId:SEED_IDS.collegeA,
  organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
};
afterAll(async()=>{await closeDatabaseConnection();});

describe("TPO-settings-audit-PREP-SCOPE-02 persisted learner ownership",()=>{
 it("denies an otherwise active College Admin selecting a foreign college",async()=>{
  await expect(readTpoLearnerPrepOutcomes(admin,SEED_IDS.collegeB,[]))
   .rejects.toBeInstanceOf(AuthorizationError);
 });
 it("rejects a real foreign-college faculty membership presented as a learner",async()=>{
  await expect(readTpoLearnerPrepOutcomes(admin,SEED_IDS.collegeA,[{
   membershipId:SEED_IDS.facultyCollegeBMembership,cohortId:randomUUID(),
  }])).rejects.toBeInstanceOf(AuthorizationError);
 });
 it("denies a learner membership with an unrelated or forged cohort",async()=>{
  await expect(readTpoLearnerPrepOutcomes(admin,SEED_IDS.collegeA,[{
   membershipId:SEED_IDS.learnerCollegeAMembership,cohortId:randomUUID(),
  }])).rejects.toBeInstanceOf(AuthorizationError);
 });
 it("denies a session revoked from College Admin role before a progress query",async()=>{
  const revoked:RequestContext={...admin,membership:{
   ...admin.membership!,roles:["LEARNER"],
  }};
  await expect(readTpoLearnerPrepOutcomes(revoked,SEED_IDS.collegeA,[{
   membershipId:SEED_IDS.learnerCollegeAMembership,cohortId:randomUUID(),
  }])).rejects.toBeInstanceOf(AuthorizationError);
 });
});
