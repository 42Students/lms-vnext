import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {resourceVisibleInAdminScope} from "@/modules/admin-ui/super-admin-resource-scope-model";
import {requireSuperAdminSelectedCollege} from "@/modules/admin-ui/super-admin-selected-college";
import {resolveSuperAdminSectionDetail} from "@/modules/admin-ui/super-admin-section-detail";
import {AcademicsServiceError} from "@/modules/academics/errors";

const sectionId="11111111-1111-4111-8111-111111111111";
const collegeId="22222222-2222-4222-8222-222222222222";
const organizationId="33333333-3333-4333-8333-333333333333";
const state=vi.hoisted(()=>({reads:0,permissions:0,
 collegeId:"22222222-2222-4222-8222-222222222222",
 organizationId:"33333333-3333-4333-8333-333333333333",missing:false}));
vi.mock("server-only",()=>({}));
vi.mock("@/modules/permissions/policy",()=>({
 AuthorizationError:class AuthorizationError extends Error{},
 requirePermission:(ctx:RequestContext)=>{
  state.permissions++;
  if(ctx.user.platformStatus!=="ACTIVE"||
   !ctx.user.systemRoles.includes("SUPER_ADMIN"))throw new Error("DENIED");
 },
}));
vi.mock("@/modules/academics/scope",()=>({
 loadSectionScope:async(id:string)=>{
  state.reads++;
  if(state.missing)throw new AcademicsServiceError("SECTION_NOT_FOUND");
  return {id,collegeId:state.collegeId,organizationId:state.organizationId};
 },
}));
function admin():RequestContext{
 return {user:{id:"44444444-4444-4444-8444-444444444444",
  identityUid:"admin",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
  membership:null,adminScope:{collegeId,organizationId}};
}
describe("SA-ACADEMICS-PEOPLE-BREAK-chat3 scoped Super Admin academic detail and identity guard",()=>{
 beforeEach(()=>{
  state.reads=0;state.permissions=0;state.collegeId=collegeId;
  state.organizationId=organizationId;state.missing=false;
 });
 it("SA-academics-people scope: selected same-college and same-organization detail loads",async()=>{
  const scope=await resolveSuperAdminSectionDetail(admin(),sectionId);
  expect(scope).toMatchObject({id:sectionId,collegeId,organizationId});
  expect(state).toMatchObject({reads:1,permissions:2});
 });
 it("SA-academics-people scope: foreign college or mismatched organization never leaks section details",async()=>{
  state.collegeId="55555555-5555-4555-8555-555555555555";
  expect(await resolveSuperAdminSectionDetail(admin(),sectionId)).toBeNull();
  state.collegeId=collegeId;
  state.organizationId="66666666-6666-4666-8666-666666666666";
  expect(await resolveSuperAdminSectionDetail(admin(),sectionId)).toBeNull();
  expect(resourceVisibleInAdminScope({collegeId,organizationId},
   {collegeId,organizationId:"foreign"})).toBe(false);
 });
 it("SA-academics-people scope: malformed and missing record resolve as hidden and do not cascade raw errors",async()=>{
  expect(await resolveSuperAdminSectionDetail(admin(),"untrusted-selector")).toBeNull();
  expect(state.reads).toBe(0);
  state.missing=true;
  expect(await resolveSuperAdminSectionDetail(admin(),sectionId)).toBeNull();
  expect(state.reads).toBe(1);
 });
 it("SA-academics-people scope: learner, mentor, and deactivated admin fail before DB reads",async()=>{
  for(const roles of [["MENTOR"],[]] as const){
   const ctx=admin();ctx.user={...ctx.user,systemRoles:[]};
   ctx.membership={id:"77777777-7777-4777-8777-777777777777",
    collegeId,organizationId,status:"ACTIVE",roles};
   await expect(resolveSuperAdminSectionDetail(ctx,sectionId)).rejects.toThrow("academics.read");
  }
  const disabled=admin();disabled.user={...disabled.user,platformStatus:"DISABLED"};
  await expect(resolveSuperAdminSectionDetail(disabled,sectionId)).rejects.toThrow("academics.read");
  expect(state.reads).toBe(0);
 });
 it("SA-academics-people scope: selected-college mutation helper rejects missing and disabled admin scope",()=>{
  const missing=admin();missing.adminScope=null;
  expect(()=>requireSuperAdminSelectedCollege(missing,"people.manage")).toThrow();
  const disabled=admin();disabled.user={...disabled.user,platformStatus:"DISABLED"};
  expect(()=>requireSuperAdminSelectedCollege(disabled,"people.manage")).toThrow();
  const allowed=requireSuperAdminSelectedCollege(admin(),"people.manage");
  expect(allowed).toEqual({collegeId,organizationId});
 });
});
