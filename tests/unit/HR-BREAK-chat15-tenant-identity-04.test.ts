import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RecruiterContext} from "@/modules/identity/context";
const permissions=vi.hoisted(()=>({can:vi.fn()}));
vi.mock("@/modules/permissions/policy",()=>({can:permissions.can}));
import {isRecruiterSharedCandidateAllowed}
 from "@/modules/placements/recruiter-shared-candidate-policy";
import {isExactRecruiterEmployerRow}
 from "@/modules/placements/recruiter-own-company-policy";
import {findRecruiterScopedGrant}
 from "@/modules/placements/recruiter-grant-selection-model";
import {isRecruiterJobVisible}
 from "@/modules/placements/recruiter-job-visibility-model";

const college="college-a",relationship="relationship-a",company="company-a";
const employer:Pick<RecruiterContext,"companyId"|"grants">={
 companyId:company,
 grants:[{id:"grant-1",organizationId:"organization-a",collegeId:college,
  collegeName:"College A",companyRelationshipId:relationship}],
};
const candidate={
 companyId:company,jobCompanyId:company,jobCollegeId:college,
 membershipCollegeId:college,applicationStatus:"SUBMITTED",
 screeningStatus:"SHORTLISTED",membershipStatus:"ACTIVE",userPlatformStatus:"ACTIVE",
};
describe("HR-TENANT-ID-04: deny forged empty employer, college and relationship scopes",()=>{
 beforeEach(()=>permissions.can.mockReset());
 it("rejects empty and whitespace company and college identifiers before candidate disclosure",()=>{
  expect(isRecruiterSharedCandidateAllowed(candidate)).toBe(true);
  for(const patch of [
   {companyId:null},{companyId:"",jobCompanyId:""},
   {companyId:" ",jobCompanyId:" "},
   {jobCompanyId:""},{jobCollegeId:"",membershipCollegeId:""},
   {jobCollegeId:" ",membershipCollegeId:" "},
   {membershipCollegeId:"other-college"},
   {userPlatformStatus:"SUSPENDED"},{applicationStatus:"WITHDRAWN"},
  ])expect(isRecruiterSharedCandidateAllowed({...candidate,...patch})).toBe(false);
 });
 it("does not treat matching empty ownership identifiers as a valid employer relationship",()=>{
  const row={companyId:company,relationshipId:relationship,collegeId:college};
  expect(isExactRecruiterEmployerRow(employer,row)).toBe(true);
  for(const altered of [
   {companyId:"",relationshipId:relationship,collegeId:college},
   {companyId:company,relationshipId:"",collegeId:college},
   {companyId:company,relationshipId:relationship,collegeId:" "},
   {companyId:"different",relationshipId:relationship,collegeId:college},
   {companyId:company,relationshipId:"different",collegeId:college},
  ])expect(isExactRecruiterEmployerRow(employer,altered)).toBe(false);
  const forged={companyId:" ",grants:[
   {...employer.grants[0]!,collegeId:" ",companyRelationshipId:" "},
  ]};
  expect(isExactRecruiterEmployerRow(forged,{
   companyId:" ",collegeId:" ",relationshipId:" ",
  })).toBe(false);
 });
 it("never selects a grant for blank scopes or another relationship in the same college",()=>{
  expect(findRecruiterScopedGrant(employer.grants,college,relationship)).toEqual(employer.grants[0]);
  for(const [targetCollege,targetRelationship] of [
   ["",relationship],[" ",relationship],[college,""],[college," "],
   [college,"other-relationship"],["other-college",relationship],
  ])expect(findRecruiterScopedGrant(employer.grants,targetCollege,targetRelationship)).toBeNull();
  expect(findRecruiterScopedGrant([],college,relationship)).toBeNull();
  expect(findRecruiterScopedGrant(null,college,relationship)).toBeNull();
 });
 it("denies malformed visibility scope without invoking central permissions",()=>{
  const context={user:{id:"recruiter-a"},recruiter:{...employer,userId:"recruiter-a",status:"ACTIVE"}};
  permissions.can.mockReturnValue(true);
  expect(isRecruiterJobVisible(context as never,college,relationship)).toBe(true);
  permissions.can.mockReset();
  for(const [targetCollege,targetRelationship] of [
   ["",relationship],[" ",relationship],[college,""],[college," "],
   ["other-college",relationship],[college,"other-relationship"],
  ])expect(isRecruiterJobVisible(context as never,targetCollege,targetRelationship)).toBe(false);
  expect(permissions.can).not.toHaveBeenCalled();
 });
 it("HR-TENANT-ID-16 refuses a valid grant carried in another session before permission lookup",()=>{
  const context={user:{id:"recruiter-a"},recruiter:{...employer,userId:"recruiter-b",status:"ACTIVE"}};
  permissions.can.mockReturnValue(true);
  expect(isRecruiterJobVisible(context as never,college,relationship)).toBe(false);
  expect(permissions.can).not.toHaveBeenCalled();
  expect(isRecruiterJobVisible({...context,recruiter:null} as never,college,relationship)).toBe(false);
 });
});
