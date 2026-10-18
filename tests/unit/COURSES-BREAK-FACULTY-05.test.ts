import {describe,expect,it} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {canAccessFacultyRoute} from "@/modules/courses/faculty-route-access-model";
import {can} from "@/modules/permissions/policy";

const collegeId="11111111-1111-4111-8111-111111111111";
const organizationId="22222222-2222-4222-8222-222222222222";
function actor(roles:NonNullable<RequestContext["membership"]>["roles"]=["FACULTY"]):RequestContext {
 return {user:{id:"33333333-3333-4333-8333-333333333333",
   identityUid:"faculty",platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:"44444444-4444-4444-8444-444444444444",
   collegeId,organizationId,status:"ACTIVE",roles}};
}
describe("COURSES-BREAK-FACULTY-05 /teacher route authorization and session scope",()=>{
 it("FAC-courses-01 an active Faculty has course-read permission and sees Faculty routes",()=>{
  const ctx=actor();
  expect(can(ctx,"courses.read",{collegeId,organizationId})).toBe(true);
  expect(canAccessFacultyRoute(ctx)).toBe(true);
 });
 it("FAC-courses-01 Learner, Mentor, TPO, College Admin and Recruiter cannot enter faculty routes by guessed URL",()=>{
  for(const role of ["LEARNER","MENTOR","TPO","COLLEGE_ADMIN"] as const){
   const ctx=actor([role]);
   expect(canAccessFacultyRoute(ctx)).toBe(false);
  }
  const recruiter=actor();
  recruiter.membership=null;
  recruiter.recruiter={
   userId:recruiter.user.id,companyId:"55555555-5555-4555-8555-555555555555",
   companyName:"Test employer",title:null,status:"ACTIVE",
   grants:[{
    id:"66666666-6666-4666-8666-666666666666",
    organizationId,collegeId,collegeName:"Test college",
    companyRelationshipId:"77777777-7777-4777-8777-777777777777",
   }],
  };
  expect(canAccessFacultyRoute(recruiter)).toBe(false);
  expect(canAccessFacultyRoute(null)).toBe(false);
  expect(canAccessFacultyRoute(undefined)).toBe(false);
 });
 it("FAC-courses-01 stale or deactivated user and membership lose Faculty page access",()=>{
  for(const status of ["SUSPENDED","ENDED"] as const){
   const ctx=actor();ctx.membership={...ctx.membership!,status};
   expect(canAccessFacultyRoute(ctx)).toBe(false);
  }
  const expired=actor();expired.membership=null;
  expect(canAccessFacultyRoute(expired)).toBe(false);
  const disabled=actor();disabled.user={...disabled.user,platformStatus:"DISABLED"};
  expect(canAccessFacultyRoute(disabled)).toBe(false);
 });
 it("FAC-courses-01 malicious selected Super Admin context cannot cross organization or college",()=>{
  const ctx=actor();
  ctx.user={...ctx.user,systemRoles:["SUPER_ADMIN"]};
  ctx.adminScope={collegeId:"55555555-5555-4555-8555-555555555555",
   organizationId};
  expect(canAccessFacultyRoute(ctx)).toBe(false);
  ctx.adminScope={collegeId,organizationId:"66666666-6666-4666-8666-666666666666"};
  expect(canAccessFacultyRoute(ctx)).toBe(false);
  ctx.adminScope={collegeId,organizationId};
  expect(canAccessFacultyRoute(ctx)).toBe(true);
 });
 it("FAC-courses-01 same college UUID but wrong organization is not a valid read target",()=>{
  expect(can(actor(),"courses.read",{
   collegeId,organizationId:"66666666-6666-4666-8666-666666666666",
  })).toBe(false);
  const ctx=actor();
  ctx.membership={...ctx.membership!,roles:[]};
  expect(canAccessFacultyRoute(ctx)).toBe(false);
 });
});
