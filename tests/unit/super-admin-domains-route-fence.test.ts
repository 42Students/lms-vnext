import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {can} from "@/modules/permissions/policy";
import type {RequestContext} from "@/modules/identity/context";
const source=readFileSync("src/app/(authenticated)/admin/domains/page.tsx","utf8");
const ctx:RequestContext={user:{id:"u",identityUid:"test",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},membership:null,adminScope:null};
describe("tenant domains empty-state authorization",()=>{
 it("requires central Super Admin permission before scope lookup",()=>{
  expect(source.indexOf('requirePermission(context,"admin-scope.select")')).toBeGreaterThan(0);
  expect(source.indexOf('requirePermission(context,"admin-scope.select")')).toBeLessThan(source.indexOf("if (!collegeId)"));
 });
 it("never permits learners and disabled actors",()=>{
  expect(can({...ctx,user:{...ctx.user,systemRoles:[]}},"admin-scope.select")).toBe(false);
  expect(can({...ctx,user:{...ctx.user,platformStatus:"DISABLED"}},"admin-scope.select")).toBe(false);
 });
});
