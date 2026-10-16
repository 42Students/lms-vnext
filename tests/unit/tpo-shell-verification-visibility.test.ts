import {describe,expect,it} from "vitest";
import {filterTpoVerificationNav,getShellNavigation} from "@/components/shell/shell-model";
import type {RequestContext} from "@/modules/identity/context";
const ctx:RequestContext={user:{id:"u",identityUid:"i",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"m",collegeId:"c",organizationId:"o",status:"ACTIVE",roles:["TPO"]}};
describe("TPO-home-R01 verification sidebar permission",()=>{
 it("does not reveal verification when the college has not allowed it",()=>{
  expect(getShellNavigation(ctx).some(item=>item.href==="/tpo/verification")).toBe(false);
  expect(getShellNavigation(ctx,null,false).some(item=>item.href==="/tpo/verification")).toBe(false);
  expect(getShellNavigation(ctx,null,true).some(item=>item.href==="/tpo/verification")).toBe(true);
 });
 it("filters only the exact TPO link",()=>{
  const items=[{label:"Verification",href:"/tpo/verification",shortLabel:"V"},
   {label:"Profile verification",href:"/college/verification",shortLabel:"C"}];
  expect(filterTpoVerificationNav(items,false)).toEqual([items[1]]);
 });
});
