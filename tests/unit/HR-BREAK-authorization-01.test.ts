import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
const policy=vi.hoisted(()=>({can:vi.fn()}));
vi.mock("@/modules/permissions/policy",()=>({can:policy.can}));
import {isRecruiterJobVisible} from "@/modules/placements/recruiter-job-visibility-model";
import {isRecruiterSharedCandidateAllowed}
 from "@/modules/placements/recruiter-shared-candidate-policy";
import {recruiterGrantEffectiveAt}
 from "@/modules/placements/recruiter-grant-expiry-policy";
import {hrRecruiterGrantLinks} from "@/modules/placements/hr-recruiter-grant-navigation-model";

const college="123e4567-e89b-42d3-a456-426614174001";
const different="123e4567-e89b-42d3-a456-426614174002";
const relationship="rel-a";
const context:RequestContext={
 user:{id:"recruiter-a",identityUid:"uid-recruiter-a",platformStatus:"ACTIVE",systemRoles:[]},
 membership:null,
 recruiter:{userId:"recruiter-a",companyId:"company-a",companyName:"Company A",title:null,status:"ACTIVE",
  grants:[{id:"grant-a",organizationId:"org-a",collegeId:college,collegeName:"College A",companyRelationshipId:relationship}]},
};
const shared={companyId:"company-a",jobCompanyId:"company-a",jobCollegeId:college,
 membershipCollegeId:college,applicationStatus:"SUBMITTED",screeningStatus:"SHORTLISTED",
 membershipStatus:"ACTIVE",userPlatformStatus:"ACTIVE"};

describe("HR-BREAK-authorization-01: revoked grants, private candidates, cross-tenant IDOR",()=>{
 beforeEach(()=>policy.can.mockReset());
 it("grants alone never disclose a job without central live permission",()=>{
  policy.can.mockReturnValue(false);
  expect(isRecruiterJobVisible(context,college,relationship)).toBe(false);
  expect(policy.can).toHaveBeenCalledWith(context,"placements.recruiter.read",{
   collegeId:college,placementCompanyRelationshipId:relationship,
  });
  policy.can.mockReturnValue(true);
  expect(isRecruiterJobVisible(context,college,relationship)).toBe(true);
 });
 it("wrong college, wrong relationship, or absent recruiter cannot invoke placement read",()=>{
  policy.can.mockReturnValue(true);
  expect(isRecruiterJobVisible(context,different,relationship)).toBe(false);
  expect(isRecruiterJobVisible(context,college,"rel-b")).toBe(false);
  expect(isRecruiterJobVisible({...context,recruiter:null},college,relationship)).toBe(false);
  expect(isRecruiterJobVisible({...context,recruiter:{...context.recruiter!,userId:"attacker"}},college,relationship)).toBe(false);
  expect(policy.can).not.toHaveBeenCalled();
 });
 it("the single shared applicant disclosure policy fails closed for every private/withdrawn/inactive condition",()=>{
  expect(isRecruiterSharedCandidateAllowed(shared)).toBe(true);
  for(const change of [
   {companyId:null},{companyId:"company-b"},{jobCollegeId:different},
   {membershipCollegeId:different},{applicationStatus:"WITHDRAWN"},
   {applicationStatus:"DRAFT"},{screeningStatus:"PENDING"},
   {screeningStatus:"REJECTED"},{membershipStatus:"INACTIVE"},
   {userPlatformStatus:"SUSPENDED"},
  ]){
   expect(isRecruiterSharedCandidateAllowed({...shared,...change})).toBe(false);
  }
 });
 it("expired, revoked, unverified, capability-limited and malformed grants all reject access",()=>{
  const now=new Date("2026-10-18T12:00:00Z");
  const good={status:"ACTIVE",verificationStatus:"VERIFIED",
    validUntil:new Date("2026-10-18T12:00:01Z"),capabilities:["READ"]};
  expect(recruiterGrantEffectiveAt(good,now,"READ")).toBe(true);
  for(const change of [
   {status:"REVOKED"},{verificationStatus:"PENDING"},
   {validUntil:null},{validUntil:new Date("2026-10-18T12:00:00Z")},
   {validUntil:new Date("invalid")},{capabilities:[]},
  ])expect(recruiterGrantEffectiveAt({...good,...change},now,"READ")).toBe(false);
 });
 it("college chooser links accept only UUID college scopes, never relative/absolute URL injection",()=>{
  const links=hrRecruiterGrantLinks(college);
  expect(links.map(x=>x.href)).toEqual([
   "/hr/home?collegeId="+college,"/hr/drives?collegeId="+college,"/hr/company?collegeId="+college,
  ]);
  for(const value of ["../admin","https://evil.invalid","",different+"?admin=1"])
   expect(()=>hrRecruiterGrantLinks(value)).toThrow();
 });
});