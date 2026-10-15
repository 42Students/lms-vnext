import {describe,it,expect} from "vitest";
import {canManageCollegeDirectoryRow as permitted} from "@/modules/colleges/admin-directory-access-model";
import type {RequestContext} from "@/modules/identity/context";
const admin:RequestContext={user:{id:"u",identityUid:"id",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},membership:null,adminScope:{collegeId:"c-1",organizationId:"org-1"}};
describe("college directory consistent parent scope",()=>{
 it("allows matching selected tenant",()=>expect(permitted(admin,{id:"c-1",organizationId:"org-1"})).toBe(true));
 it("denies same college ID under inconsistent parent",()=>expect(permitted(admin,{id:"c-1",organizationId:"org-2"})).toBe(false));
 it("denies foreign college",()=>expect(permitted(admin,{id:"c-2",organizationId:"org-1"})).toBe(false));
});
