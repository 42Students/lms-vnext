import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {can,requirePermission,AuthorizationError} from "@/modules/permissions/policy";
import type {RequestContext} from "@/modules/identity/context";

const base:RequestContext={
 user:{id:"11111111-1111-4111-8111-111111111111",identityUid:"u",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
 membership:null,
 adminScope:null,
};
const pages=[
 "src/app/(authenticated)/admin/tenants/page.tsx",
 "src/app/(authenticated)/admin/module-access/page.tsx",
 "src/app/(authenticated)/admin/organizations/page.tsx",
];

describe("SA-tenants-modules-SEC-01: never render admin filter recovery before authorization",()=>{
 it("rejects an expired Super Admin, a member without a system role, and a missing context",()=>{
  expect(can(base,"admin-scope.select")).toBe(true);
  const disabled={...base,user:{...base.user,platformStatus:"DISABLED" as const}};
  const collegeOnly={...base,user:{...base.user,systemRoles:[] as const},membership:{
   id:"22222222-2222-4222-8222-222222222222",
   collegeId:"33333333-3333-4333-8333-333333333333",
   organizationId:"44444444-4444-4444-8444-444444444444",
   status:"ACTIVE" as const,roles:["COLLEGE_ADMIN" as const],
  }};
  for(const context of [disabled,collegeOnly,null]){
   expect(can(context,"admin-scope.select")).toBe(false);
   expect(()=>requirePermission(context,"admin-scope.select")).toThrow(AuthorizationError);
  }
 });
 it("authenticates every route before handling hostile and repeated query parameters",()=>{
  for(const file of pages){
   const source=readFileSync(file,"utf8");
   const auth=source.indexOf('requirePermission(context,"admin-scope.select")');
   const invalid=source.indexOf("if (!filters)");
   const invalidNoSpace=source.indexOf("if(!parsed");
   const whitespace=source.indexOf("if (!parsed");
   const recovery=[invalid,invalidNoSpace,whitespace].filter(index=>index>=0);
   expect(auth,file).toBeGreaterThan(-1);
   expect(recovery.length,file).toBeGreaterThan(0);
   expect(auth,file).toBeLessThan(Math.min(...recovery));
   expect(source,file).toContain("getCurrentRequestContext()");
  }
 });
});
