import {beforeEach,describe,expect,it,vi} from "vitest";
import {isValidElement} from "react";
import SuperAdminShortlistedDetail from "@/app/(authenticated)/admin/placements/shortlisted/[applicationId]/page";

const applicationId="11111111-1111-4111-8111-111111111111";
const state=vi.hoisted(()=>({scoped:true,allowed:true,fail:false,found:true,calls:0}));
vi.mock("next/navigation",()=>({
  notFound:()=>{throw new Error("NEXT_NOT_FOUND");},
}));
vi.mock("@/auth/request-context",()=>({
  getCurrentRequestContext:async()=>({
    user:{id:"admin",identityUid:"admin",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
    membership:null,
    adminScope:state.scoped?{collegeId:"22222222-2222-4222-8222-222222222222"}:null,
  }),
}));
vi.mock("@/modules/permissions/policy",()=>({can:()=>state.allowed}));
vi.mock("@/modules/admin-ui/super-admin-shortlisted-detail-service",()=>({
  getSuperAdminShortlistedDetail:async()=>{
    state.calls+=1;
    if(state.fail)throw new Error("INTERNAL_DB_SECRET");
    return state.found?{title:"Student",status:"SHORTLISTED",facts:[]}:null;
  },
}));
vi.mock("@/components/admin/super-admin-placement-detail-view",()=>({
  SuperAdminPlacementDetailView:()=>null,
}));
function content(node:unknown):string[]{
  if(node===null||node===undefined||typeof node==="boolean")return [];
  if(typeof node==="string"||typeof node==="number")return [String(node)];
  if(Array.isArray(node))return node.flatMap(content);
  if(!isValidElement(node))return [];
  const props=node.props as Record<string,unknown>;
  return ["children","title","description","href","action"].flatMap(x=>content(props[x]));
}
const render=(id:string)=>SuperAdminShortlistedDetail({params:Promise.resolve({applicationId:id})});
beforeEach(()=>{state.scoped=true;state.allowed=true;state.fail=false;state.found=true;state.calls=0;});
describe("Super Admin last-third shortlisted applicant detail page states",()=>{
 it("SA-placements-shortlisted-04 no selected college or denied permission never query applicant PII",async()=>{
  state.scoped=false;
  expect(content(await render(applicationId)).join(" ")).toContain("Select a college to continue");
  state.scoped=true;state.allowed=false;
  expect(content(await render(applicationId)).join(" ")).toContain("Select a college to continue");
  expect(state.calls).toBe(0);
 });
 it("SA-placements-shortlisted-05 malformed and missing applicant UUIDs do not disclose results",async()=>{
  await expect(render("bad-id")).rejects.toThrow("NEXT_NOT_FOUND");
  expect(state.calls).toBe(0);
  state.found=false;
  await expect(render(applicationId)).rejects.toThrow("NEXT_NOT_FOUND");
  expect(state.calls).toBe(1);
 });
 it("SA-placements-shortlisted-06 failed DB load shows navigation recovery without raw secrets",async()=>{
  state.fail=true;
  const view=content(await render(applicationId)).join(" ");
  expect(view).toContain("Shortlisted applicant unavailable");
  expect(view).toContain("Back to shortlisted applicants");
  expect(view).not.toContain("INTERNAL_DB_SECRET");
  expect(state.calls).toBe(1);
 });
 it("SA-placements-shortlisted-07 permitted result renders a detail component",async()=>{
  const element=await render(applicationId);
  expect(isValidElement(element)).toBe(true);
  expect(state.calls).toBe(1);
 });
});
