import {describe,it,expect} from "vitest";
import {canManageCollegeDirectoryRow as allowed} from "@/modules/colleges/admin-directory-access-model";
import type {RequestContext} from "@/modules/identity/context";
const admin:RequestContext={user:{id:"u",identityUid:"uid",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},membership:null,adminScope:{collegeId:"c-a",organizationId:"o-a"}};
describe("Super Admin college directory row actions",()=>{
 it("permits selected college",()=>expect(allowed(admin,{id:"c-a",organizationId:"o-a"})).toBe(true));
 it("denies different college and organization",()=>{
  expect(allowed(admin,{id:"c-b",organizationId:"o-a"})).toBe(false);
  expect(allowed(admin,{id:"c-a",organizationId:"o-b"})).toBe(false);
 });
 it("denies inactive or non Super Admin",()=>{
  expect(allowed({...admin,user:{...admin.user,platformStatus:"DISABLED"}},{id:"c-a",organizationId:"o-a"})).toBe(false);
  expect(allowed({...admin,user:{...admin.user,systemRoles:[]}},{id:"c-a",organizationId:"o-a"})).toBe(false);
 });
});
