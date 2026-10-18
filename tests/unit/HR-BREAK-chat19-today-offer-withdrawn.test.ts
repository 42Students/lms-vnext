import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {isRecruiterSharedCandidateAllowed} from "@/modules/placements/recruiter-shared-candidate-policy";

const shared={
 companyId:"company",jobCompanyId:"company",
 jobCollegeId:"college",membershipCollegeId:"college",
 applicationStatus:"SUBMITTED",screeningStatus:"SHORTLISTED",
 membershipStatus:"ACTIVE",userPlatformStatus:"ACTIVE",
};
describe("HR-BREAK-OFFER-FOLLOWUP-15: withdrawn/unshared students never produce recruiter follow-ups",()=>{
 it("a withdrawn application is no longer a shared candidate even when screening remains shortlisted",()=>{
  expect(isRecruiterSharedCandidateAllowed(shared)).toBe(true);
  expect(isRecruiterSharedCandidateAllowed({...shared,applicationStatus:"WITHDRAWN"})).toBe(false);
  expect(isRecruiterSharedCandidateAllowed({...shared,screeningStatus:"REJECTED"})).toBe(false);
  expect(isRecruiterSharedCandidateAllowed({...shared,membershipStatus:"SUSPENDED"})).toBe(false);
  expect(isRecruiterSharedCandidateAllowed({...shared,jobCompanyId:"foreign-company"})).toBe(false);
  expect(isRecruiterSharedCandidateAllowed({...shared,membershipCollegeId:"other-college"})).toBe(false);
 });
 it("the service applies each corresponding persisted eligibility predicate before aggregating offer counts",()=>{
  const source=readFileSync("src/modules/placements/hr-today-offer-actions-service.ts","utf8");
  const start=source.indexOf(".where(and("),end=source.indexOf(".groupBy(",start);
  expect(start).toBeGreaterThan(0);
  expect(end).toBeGreaterThan(start);
  const query=source.slice(start,end);
  for(const guard of [
   "inArray(placementJobs.id,ids)",
   "eq(placementJobs.collegeId,collegeId)",
   'eq(placementJobs.status,"PUBLISHED")',
   "isNull(placementJobs.archivedAt)",
   'eq(placementApplications.status,"SUBMITTED")',
   "eq(collegeMemberships.collegeId,collegeId)",
   'eq(collegeMemberships.status,"ACTIVE")',
   'eq(users.platformStatus,"ACTIVE")',
   'eq(placementApplicationScreenings.status,"SHORTLISTED")',
  ])expect(query).toContain(guard);
  expect(query).toContain('"ISSUED","ACCEPTED","DECLINED"');
  expect(source).toContain("count(distinct");
 });
 it("short-circuits empty scoped job IDs before any DB read",()=>{
  const source=readFileSync("src/modules/placements/hr-today-offer-actions-service.ts","utf8");
  expect(source.indexOf("if(!ids.length)return []")).toBeLessThan(source.indexOf("getDb().select"));
 });
});
