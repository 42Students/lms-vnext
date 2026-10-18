import {describe,expect,it} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {mayRecordCollegeAdminDeliveryLock} from "@/modules/projects/admin-submission-lock-policy";

const college="11111111-1111-4111-8111-111111111111";
const foreignCollege="22222222-2222-4222-8222-222222222222";
const org="33333333-3333-4333-8333-333333333333";
const otherOrg="44444444-4444-4444-8444-444444444444";
const admin:RequestContext={
 user:{id:"actor",identityUid:"identity",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"member",collegeId:college,organizationId:org,status:"ACTIVE",
   roles:["COLLEGE_ADMIN"]},
 recruiter:null,
};
describe("PROJ-BREAK-COLLEGE-LOCK-01: delivery event may only record a real same-tenant college admin",()=>{
 it("permits active authenticated College Admin on exact college + organization",()=>{
  expect(mayRecordCollegeAdminDeliveryLock(admin,college,org)).toBe(true);
 });
 it.each([
  ["wrong college",{...admin},foreignCollege,org],
  ["wrong organization",{...admin},college,otherOrg],
  ["suspended member",{...admin,membership:{...admin.membership!,status:"SUSPENDED" as const}},college,org],
  ["disabled user",{...admin,user:{...admin.user,platformStatus:"DISABLED" as const}},college,org],
  ["TPO-only",{...admin,membership:{...admin.membership!,roles:["TPO" as const]}},college,org],
  ["learner-only",{...admin,membership:{...admin.membership!,roles:["LEARNER" as const]}},college,org],
  ["missing membership",{...admin,membership:null},college,org],
 ])("denies %s before writing membership-bound audit events",(_why,actor,c,o)=>{
  expect(mayRecordCollegeAdminDeliveryLock(actor,c,o)).toBe(false);
 });
 it("never substitutes acting college for a real membership-bound event actor",()=>{
  const sa:RequestContext={...admin,
   user:{...admin.user,systemRoles:["SUPER_ADMIN"]},
   adminScope:{collegeId:foreignCollege,organizationId:otherOrg},
  };
  expect(mayRecordCollegeAdminDeliveryLock(sa,foreignCollege,otherOrg)).toBe(false);
  expect(mayRecordCollegeAdminDeliveryLock({...sa,membership:null},
   foreignCollege,otherOrg)).toBe(false);
 });
 it("a recruiter grant to the correct college does not imply membership or lock privilege",()=>{
  const recruiter:RequestContext={...admin,membership:null,recruiter:{
   userId:"actor",companyId:"employer",companyName:"Employer",title:null,status:"ACTIVE",
   grants:[{id:"grant",collegeId:college,organizationId:org,collegeName:"College",
    companyRelationshipId:"rel"}],
  }};
  expect(mayRecordCollegeAdminDeliveryLock(recruiter,college,org)).toBe(false);
 });
});
