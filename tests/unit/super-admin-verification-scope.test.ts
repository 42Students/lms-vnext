import {describe,it,expect} from "vitest";
import {can} from "@/modules/permissions/policy";
import type {RequestContext} from "@/modules/identity/context";
const active:RequestContext={user:{id:"admin",identityUid:"uid",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},membership:null,adminScope:{organizationId:"org-a",collegeId:"college-a"}};
describe("Super Admin verification authorization",()=>{
 it("authorizes selected college only",()=>{
 expect(can(active,"profile-verification.review",{collegeId:"college-a",organizationId:"org-a"})).toBe(true);
 expect(can(active,"profile-verification.review",{collegeId:"college-b",organizationId:"org-b"})).toBe(false);
 });
 it("denies non-super admins and suspended identities",()=>{
 expect(can({...active,user:{...active.user,systemRoles:[]}},"profile-verification.review",{collegeId:"college-a",organizationId:"org-a"})).toBe(false);
 expect(can({...active,user:{...active.user,platformStatus:"DISABLED"}},"profile-verification.review",{collegeId:"college-a",organizationId:"org-a"})).toBe(false);
 });
});
