import {describe,expect,it} from "vitest";
import {adminUsersQuerySchema,adminUsersHref,adminUserDirectoryPaging,
 roleForPeopleTab,adminPeopleSearchState,ADMIN_USERS_PAGE_SIZE}
 from "@/modules/people/admin-user-directory-model";
import {adminUnassignedUsersQuerySchema,adminUnassignedUsersHref,
 unassignedIdentityScopeAllowed,unassignedIdentityPage}
 from "@/modules/people/admin-unassigned-user-model";
import {resourceVisibleInAdminScope}
 from "@/modules/admin-ui/super-admin-resource-scope-model";
import {can} from "@/modules/permissions/policy";
import type {RequestContext} from "@/modules/identity/context";

const collegeId="11111111-1111-4111-8111-111111111111";
const organizationId="22222222-2222-4222-8222-222222222222";
function admin():RequestContext{
 return {user:{id:"33333333-3333-4333-8333-333333333333",
  identityUid:"admin",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
  membership:null,adminScope:null};
}
describe("SA-ACADEMICS-PEOPLE-BREAK-chat3-02 admin directories and selected-scope safety",()=>{
 it("SA-academics-people global unassigned identities are visible only with no active safety scope",()=>{
  for(const selected of [
   {organizationId,collegeId:null},{organizationId:null,collegeId},
   {organizationId,collegeId},
  ])expect(unassignedIdentityScopeAllowed(selected)).toBe(false);
  expect(unassignedIdentityScopeAllowed(null)).toBe(true);
  expect(unassignedIdentityScopeAllowed({organizationId:null,collegeId:null})).toBe(true);
 });
 it("SA-academics-people selected college cannot grant read outside its organization",()=>{
  const ctx=admin();ctx.adminScope={collegeId,organizationId};
  expect(can(ctx,"people.manage",{collegeId,organizationId})).toBe(true);
  expect(can(ctx,"people.manage",{
   collegeId:"44444444-4444-4444-8444-444444444444",
   organizationId,
  })).toBe(false);
  expect(can(ctx,"academics.read",{
   collegeId,organizationId:"55555555-5555-4555-8555-555555555555",
  })).toBe(false);
  expect(resourceVisibleInAdminScope(ctx.adminScope,{collegeId,organizationId})).toBe(true);
  expect(resourceVisibleInAdminScope(ctx.adminScope,{
   collegeId:"44444444-4444-4444-8444-444444444444",organizationId,
  })).toBe(false);
 });
 it("SA-academics-people Learner, Mentor and disabled Super Admin have no administrative capability",()=>{
  const ctx=admin();
  ctx.user={...ctx.user,systemRoles:[]};
  ctx.membership={id:"66666666-6666-4666-8666-666666666666",
   collegeId,organizationId,status:"ACTIVE",roles:["MENTOR"]};
  expect(can(ctx,"people.manage",{collegeId,organizationId})).toBe(false);
  expect(can(ctx,"academics.manage",{collegeId,organizationId})).toBe(false);
  ctx.membership={...ctx.membership,roles:["LEARNER"]};
  expect(can(ctx,"people.manage",{collegeId,organizationId})).toBe(false);
  const disabled=admin();
  disabled.user={...disabled.user,platformStatus:"DISABLED"};
  expect(can(disabled,"people.manage",{collegeId,organizationId})).toBe(false);
 });
 it("SA-academics-people never coerce unsupported role, status, query length or unknown keys into directory scope",()=>{
  for(const invalid of [
   {role:"ROOT"}, {membershipStatus:"DELETED"},
   {platformStatus:"SUSPENDED"}, {q:"x".repeat(101)},
   {page:0}, {page:100001}, {page:"Infinity"}, {collegeId},
  ])expect(adminUsersQuerySchema.safeParse(invalid).success).toBe(false);
  for(const invalid of [
   {role:"FACULTY"}, {platformStatus:"SUSPENDED"},
   {page:0}, {page:1001}, {q:"x".repeat(101)}, {email:"secret"},
  ])expect(adminUnassignedUsersQuerySchema.safeParse(invalid).success).toBe(false);
 });
 it("SA-academics-people Faculty and Student tab filters cannot retain a conflicting role",()=>{
  const faculty=adminUsersQuerySchema.parse({tab:"FACULTY",role:"LEARNER"});
  expect(roleForPeopleTab(faculty)).toBe("FACULTY");
  expect(adminPeopleSearchState(faculty)).toEqual({
   hiddenTab:"FACULTY",showExplicitRoleFilter:false,effectiveRole:"FACULTY",
  });
  const student=adminUsersQuerySchema.parse({tab:"STUDENT",role:"MENTOR"});
  expect(roleForPeopleTab(student)).toBe("LEARNER");
  expect(adminUsersHref({...student,role:"ALL",page:2}))
   .toContain("tab=STUDENT");
 });
 it("SA-academics-people page clamping remains deterministic at first, final and empty pages",()=>{
  expect(ADMIN_USERS_PAGE_SIZE).toBe(30);
  expect(adminUserDirectoryPaging(0,100)).toMatchObject({page:1,totalPages:1,offset:0});
  expect(adminUserDirectoryPaging(61,100)).toMatchObject({page:3,totalPages:3,offset:60});
  expect(unassignedIdentityPage(61,100)).toMatchObject({page:3,totalPages:3,offset:60});
  expect(adminUnassignedUsersHref({role:"NONE",q:"No membership",page:2}))
   .toContain("role=NONE");
 });
});
