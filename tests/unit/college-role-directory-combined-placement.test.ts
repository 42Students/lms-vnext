import {describe,it,expect} from "vitest";
import {collegeRoleDirectoryQuerySchema,assertCompatibleCollegeRoleDirectoryFilters} from "@/modules/people/college-role-directory-model";
describe("College Student single-enrollment query contract",()=>{
 const programId="00000000-0000-4000-8000-000000000044";
 const cohortId="00000000-0000-4000-8000-000000000045";
 it("validates a multi-facet current placement",()=>{
  const filter=collegeRoleDirectoryQuerySchema.parse({programId,cohortId,classPresence:"ASSIGNED"});
  expect(()=>assertCompatibleCollegeRoleDirectoryFilters("LEARNER",filter)).not.toThrow();
 });
 it("denies no active enrollment with an exact program",()=>{
  const filter=collegeRoleDirectoryQuerySchema.parse({programId,enrollment:"NONE"});
  expect(()=>assertCompatibleCollegeRoleDirectoryFilters("LEARNER",filter)).toThrow("LEARNER_ENROLLMENT_FILTER_CONFLICT");
 });
});
