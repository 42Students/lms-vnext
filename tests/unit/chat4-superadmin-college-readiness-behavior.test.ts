import {describe, expect, it} from "vitest";
import {evaluateCollegeReadiness, type CollegeReadinessFacts} from "@/modules/colleges/readiness-model";
import {buildSuperAdminReadinessCsv} from "@/modules/colleges/admin-readiness-export-model";
import {visibleReadinessChecks,parseSuperAdminReadinessParams} from "@/modules/colleges/admin-readiness-filter";

const ready:CollegeReadinessFacts={
 collegeStatus:"ACTIVE",
 adminMemberships:1,departments:1,programs:1,cohorts:1,
 enrolledLearners:50,facultyMemberships:5,tpoMemberships:1,
 activePlacementSeasons:1,verifiedPrimaryDomains:1,
};
describe("Super Admin college onboarding readiness, filtering and CSV integrity",()=>{
 it("SA-colleges-readiness-01 every persisted check must pass for READY; zero is FAIL and unknown is not zero",()=>{
  const all=evaluateCollegeReadiness(ready);
  expect(all.overall).toBe("READY");
  expect(all.counts).toEqual({total:10,passed:10,failed:0,unknown:0});
  expect(new Set(all.checks.map(check=>check.id)).size).toBe(10);
  expect(evaluateCollegeReadiness({...ready,facultyMemberships:0}).overall).toBe("NOT_READY");
  const unknown=evaluateCollegeReadiness({...ready,verifiedPrimaryDomains:null});
  expect(unknown.overall).toBe("INCOMPLETE");
  expect(unknown.counts).toEqual({total:10,passed:9,failed:0,unknown:1});
  expect(unknown.checks.find(check=>check.id==="TENANT_DOMAIN")).toMatchObject({
   status:"UNKNOWN",evidence:"The persisted source could not be verified.",
  });
  expect(evaluateCollegeReadiness({...ready,facultyMemberships:0,verifiedPrimaryDomains:null}).overall)
   .toBe("NOT_READY");
  expect(evaluateCollegeReadiness({...ready,collegeStatus:"ARCHIVED"}).overall).toBe("NOT_READY");
  expect(evaluateCollegeReadiness({...ready,collegeStatus:null}).overall).toBe("INCOMPLETE");
 });
 it("SA-colleges-readiness-02 area and attention filters preserve original check results without inventing green statuses",()=>{
  const model=evaluateCollegeReadiness({...ready,programs:0,facultyMemberships:null});
  expect(visibleReadinessChecks(model.checks,"ALL")).toEqual(model.checks);
  expect(visibleReadinessChecks(model.checks,"NEEDS_ATTENTION").map(check=>check.id))
   .toEqual(["PROGRAMS","FACULTY"]);
  expect(visibleReadinessChecks(model.checks,"FAIL","ACADEMICS").map(check=>check.id))
   .toEqual(["PROGRAMS"]);
  expect(visibleReadinessChecks(model.checks,"UNKNOWN","PEOPLE").map(check=>check.id))
   .toEqual(["FACULTY"]);
  expect(visibleReadinessChecks(model.checks,"PASS","DOMAINS").map(check=>check.id))
   .toEqual(["TENANT_DOMAIN"]);
  expect(parseSuperAdminReadinessParams({status:"NEEDS_ATTENTION",area:"PEOPLE"}))
   .toEqual({status:"NEEDS_ATTENTION",area:"PEOPLE"});
  for(const input of [
   {status:["PASS","FAIL"]},{area:"SECRET"},{status:"INVISIBLE"},
   {collegeId:"22222222-2222-4222-8222-222222222222"},
  ])expect(parseSuperAdminReadinessParams(input)).toBeNull();
 });
 it("SA-colleges-readiness-03 export uses only verified check evidence, CSV escaping and never claims runtime production approval",()=>{
  const result=evaluateCollegeReadiness({...ready,programs:null});
  const csv=buildSuperAdminReadinessCsv({
   name:'=HYPERLINK("https://attacker","click")',
   code:"C-01",
  },result);
  expect(csv).toContain('"\'=HYPERLINK(');
  expect(csv).toContain('""https://attacker""');
  expect(csv).toContain('The persisted source could not be verified.');
  expect(csv).toContain('"UNKNOWN"');
  expect(csv).toContain('"Code"');
  expect(csv).toContain('"Remediation"');
  expect(csv).not.toContain("Launch approved");
  expect(csv.endsWith("\r\n")).toBe(true);
  // Header + exactly ten recorded checks, no synthetic record.
  expect(csv.trimEnd().split("\r\n")).toHaveLength(11);
 });
});