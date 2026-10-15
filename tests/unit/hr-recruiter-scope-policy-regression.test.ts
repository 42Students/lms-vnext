import {expect,it} from "vitest";
import {can} from "@/modules/permissions/policy";
import type {RequestContext} from "@/modules/identity/context";
it("does not accidentally grant anonymous principals recruiter job-read authority",()=>{
 const context:RequestContext={user:{id:"11111111-1111-4111-8111-111111111111",
  identityUid:"anonymous",platformStatus:"ACTIVE",systemRoles:[]},membership:null,recruiter:null};
 expect(can(context,"placements.recruiter.read",{
  collegeId:"11111111-1111-4111-8111-111111111111",
  placementCompanyRelationshipId:"22222222-2222-4222-8222-222222222222",
 })).toBe(false);
});
