import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";

const mocked=vi.hoisted(()=>({db:vi.fn()}));
vi.mock("@/db/client",()=>({getDb:mocked.db}));
vi.mock("@/modules/placements/staged-tables",()=>({placementTableExists:vi.fn()}));
import {
 ownRecruiterGrant,getRecruiterSelfProfile,leaveOwnRecruiterCollegeAccess,
} from "@/modules/placements/recruiter-profile-service";

const id="11111111-1111-4111-8111-111111111111";
const context:RequestContext={
 user:{id:"recruiter-a",identityUid:"identity",platformStatus:"ACTIVE",systemRoles:[]},
 membership:null,recruiter:{
  userId:"recruiter-a",companyId:"employer",companyName:"Employer",
  title:null,status:"ACTIVE",grants:[{
   id,collegeId:"22222222-2222-4222-8222-222222222222",
   organizationId:"33333333-3333-4333-8333-333333333333",
   collegeName:"College",companyRelationshipId:"44444444-4444-4444-8444-444444444444",
  }],
 },
};
describe("HR-BREAK-PROFILE-IDENTITY-10: recruiter self-profile and grant mutation principal",()=>{
 beforeEach(()=>vi.clearAllMocks());
 it("returns an own-grant identifier only for an exact active recruiter principal",()=>{
  expect(ownRecruiterGrant(context,id)).toBe(context.recruiter!.grants[0]);
  expect(mocked.db).not.toHaveBeenCalled();
 });
 it("no recruiter profile may read the wrong principal's employer/grant data",async()=>{
  const forged:RequestContext={
   ...context,recruiter:{...context.recruiter!,userId:"another-recruiter"},
  };
  expect(()=>ownRecruiterGrant(forged,id)).toThrow();
  await expect(getRecruiterSelfProfile(forged)).rejects.toThrow();
  await expect(leaveOwnRecruiterCollegeAccess(forged,id)).rejects.toThrow();
  expect(mocked.db).not.toHaveBeenCalled();
 });
 it("disabled or absent recruiter is denied before any persisted user read or mutation",async()=>{
  for(const invalid of [
   {...context,user:{...context.user,platformStatus:"DISABLED" as const}},
   {...context,recruiter:null},
  ]){
   expect(()=>ownRecruiterGrant(invalid,id)).toThrow();
   await expect(getRecruiterSelfProfile(invalid)).rejects.toThrow();
   await expect(leaveOwnRecruiterCollegeAccess(invalid,id)).rejects.toThrow();
  }
  expect(mocked.db).not.toHaveBeenCalled();
 });
 it("a grant ID from a different college is not implicitly owned",()=>{
  expect(()=>ownRecruiterGrant(context,"55555555-5555-4555-8555-555555555555")).toThrow();
  expect(mocked.db).not.toHaveBeenCalled();
 });
});
