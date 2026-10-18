import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {recruiterGrantEffectiveAt}
 from "@/modules/placements/recruiter-grant-expiry-policy";

const now=new Date("2099-06-15T12:00:00.000Z");
const valid={status:"ACTIVE",verificationStatus:"VERIFIED",
 validUntil:new Date("2099-06-15T12:00:00.001Z"),
 capabilities:["DRIVES","MESSAGES"]};

describe("HR-GRANT-EXPIRE-39 cached recruiter grants cannot outlive persisted access",()=>{
 it("requires VERIFIED, ACTIVE, unexpired, capability-specific grant at the precise expiry boundary",()=>{
  expect(recruiterGrantEffectiveAt(valid,now,"DRIVES")).toBe(true);
  expect(recruiterGrantEffectiveAt(valid,now,"MESSAGES")).toBe(true);
  for(const patch of [
   {status:"REVOKED"},{status:"ARCHIVED"},
   {verificationStatus:"PENDING"},{verificationStatus:"REJECTED"},
   {validUntil:null},
   {validUntil:new Date("2099-06-15T12:00:00.000Z")},
   {validUntil:new Date("2099-06-15T11:59:59.999Z")},
   {capabilities:["MESSAGES"]},{capabilities:[]},
  ])expect(recruiterGrantEffectiveAt({...valid,...patch},now,"DRIVES")).toBe(false);
 });
 it("an unrelated MESSAGES capability never authorizes employer rounds, slots or candidates",()=>{
  expect(recruiterGrantEffectiveAt({...valid,capabilities:["MESSAGES"]},now,"DRIVES")).toBe(false);
  expect(recruiterGrantEffectiveAt({...valid,capabilities:["MESSAGES"]},now,"MESSAGES")).toBe(true);
 });
 it("workspace, both round operations, slot authorization and both count queries check live expiry",()=>{
  const policies=[
   ["src/modules/placements/recruiter-workspace-service.ts",1],
   ["src/modules/placements/hr-round-editor-service.ts",2],
   ["src/modules/placements/hr-interview-slot-service.ts",1],
   ["src/modules/placements/recruiter-portfolio-counts-service.ts",2],
  ] as const;
  for(const [path,n] of policies){
   const source=readFileSync(path,"utf8");
   for(const clause of [
    'eq(placementRecruiterCollegeGrants.status,"ACTIVE")',
    'eq(placementRecruiterCollegeGrants.verificationStatus,"VERIFIED")',
    'gt(placementRecruiterCollegeGrants.validUntil,sql`clock_timestamp()`)',
    "'DRIVES' = ANY(${placementRecruiterCollegeGrants.capabilities})",
   ])expect(source).toContain(clause);
   expect(source.split('gt(placementRecruiterCollegeGrants.validUntil,sql`clock_timestamp()`)').length-1)
    .toBe(n);
  }
 });
 it("company team denies expired and unverified grants before the coworkers query",()=>{
  const source=readFileSync("src/modules/placements/recruiter-company-team-service.ts","utf8");
  const query=source.slice(source.indexOf("const [company]"),
   source.indexOf("if (!company) throw new AuthorizationError"));
  for(const clause of [
   'eq(placementRecruiterCollegeGrants.id,scope.grant.id)',
   'eq(placementRecruiterCollegeGrants.status,"ACTIVE")',
   'eq(placementRecruiterCollegeGrants.verificationStatus,"VERIFIED")',
   'gt(placementRecruiterCollegeGrants.validUntil,sql`clock_timestamp()`)',
  ])expect(query).toContain(clause);
  expect(source.indexOf("if (!company) throw new AuthorizationError"))
   .toBeLessThan(source.indexOf("const team = await db"));
 });
});
