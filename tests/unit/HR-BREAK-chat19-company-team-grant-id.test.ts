import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import type {RequestContext} from "@/modules/identity/context";
import {resolveRecruiterCompanyScope} from "@/modules/placements/recruiter-company-team-service";

const college="11111111-1111-4111-8111-111111111111";
const relationship="22222222-2222-4222-8222-222222222222";
const grantA={
 id:"33333333-3333-4333-8333-333333333333",
 organizationId:"org-a",collegeId:college,collegeName:"College",
 companyRelationshipId:relationship,
};
const grantB={...grantA,id:"44444444-4444-4444-8444-444444444444"};
const actor:RequestContext={
 user:{id:"recruiter-a",identityUid:"identity",platformStatus:"ACTIVE",systemRoles:[]},
 membership:null,
 recruiter:{userId:"recruiter-a",companyId:"company",companyName:"Company",status:"ACTIVE",
  title:null,grants:[grantA,grantB]},
};

describe("HR-BREAK-TEAM-GRANT-14: stale grant ID cannot be rescued by another active grant",()=>{
 it("selects the concrete college grant in the recruiter session, not an invented substitute",()=>{
  const scope=resolveRecruiterCompanyScope(actor,college);
  expect(scope.status).toBe("READY");
  if(scope.status!=="READY")throw Error("Expected selected grant");
  expect(scope.grant.id).toBe(grantA.id);
  expect(scope.grant.companyRelationshipId).toBe(relationship);
  expect(scope.choices).toHaveLength(2);
 });
 it("queries persistence for the exact selected grant ID, same user and relationship before listing team",()=>{
  const source=readFileSync("src/modules/placements/recruiter-company-team-service.ts","utf8");
  const start=source.indexOf("const [company] =");
  const end=source.indexOf("if (!company) throw new AuthorizationError",start);
  expect(start).toBeGreaterThan(0);
  expect(end).toBeGreaterThan(start);
  const query=source.slice(start,end);
  for(const scope of [
   "eq(placementRecruiterCollegeGrants.id,scope.grant.id)",
   "eq(placementRecruiterCollegeGrants.recruiterUserId,context.user.id)",
   "eq(placementRecruiterCollegeGrants.companyRelationshipId,placementCompanyRelationships.id)",
   'eq(placementRecruiterCollegeGrants.status,"ACTIVE")',
   "eq(placementCompanyRelationships.collegeId, scope.grant.collegeId)",
   "eq(placementCompanyRelationships.companyId, recruiter.companyId)",
  ])expect(query).toContain(scope);
  expect(end).toBeLessThan(source.indexOf("const team = await db"));
 });
 it("never accepts another college ID or a borrowed recruiter identity before any database query",()=>{
  expect(()=>resolveRecruiterCompanyScope(actor,"55555555-5555-4555-8555-555555555555"))
   .toThrow();
  expect(()=>resolveRecruiterCompanyScope({
   ...actor,recruiter:{...actor.recruiter!,userId:"borrowed"},
  },college)).toThrow();
 });
});
