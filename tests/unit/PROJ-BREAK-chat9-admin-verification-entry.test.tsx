import {beforeEach,describe,expect,it,vi} from "vitest";
import {isValidElement} from "react";
import AdminVerificationEntry from "@/app/(authenticated)/admin/verification/page";

const state=vi.hoisted(()=>({
  role:"ADMIN" as "ADMIN"|"COLLEGE"|"DISABLED",
  selected:false,
}));
vi.mock("@/auth/request-context",()=>({
  getCurrentRequestContext:async()=>({
    user:{id:"actor",identityUid:"admin",
      platformStatus:state.role==="DISABLED"?"DISABLED":"ACTIVE",
      systemRoles:state.role==="COLLEGE"?[]:["SUPER_ADMIN"]},
    membership:null,
    adminScope:state.selected?{
      organizationId:"11111111-1111-4111-8111-111111111111",
      collegeId:"22222222-2222-4222-8222-222222222222",
    }:null,
  }),
}));
vi.mock("next/navigation",()=>({
  redirect:(href:string):never=>{throw Error("EXPECTED_REDIRECT:"+href);},
}));
function visible(node:unknown):string[]{
  if(node===null||node===undefined||typeof node==="boolean")return [];
  if(typeof node==="number"||typeof node==="string")return [String(node)];
  if(Array.isArray(node))return node.flatMap(visible);
  if(!isValidElement(node))return [];
  const props=node.props as Record<string,unknown>;
  return ["children","title","description","action","href"].flatMap(key=>visible(props[key]));
}
beforeEach(()=>{state.role="ADMIN";state.selected=false;});
describe("Super Admin last-third: verification entry security and scope",()=>{
  it("UX-admin-verification-19 expired and college-only roles see a safe denial with no selected-scope redirect",async()=>{
    for(const role of ["COLLEGE","DISABLED"] as const){
      state.role=role;state.selected=true;
      const page=visible(await AdminVerificationEntry()).join(" ");
      expect(page).toContain("Verification access denied");
      expect(page).toContain("Back to dashboard");
      expect(page).not.toContain("/admin/colleges/22222222-2222-4222-8222-222222222222/verification");
    }
  });
  it("UX-admin-verification-20 a global operator must select a college rather than inheriting a guessed default",async()=>{
    const page=visible(await AdminVerificationEntry()).join(" ");
    expect(page).toContain("Choose a college first");
    expect(page).toContain("Profile verification");
  });
  it("UX-admin-verification-21 a scoped operator navigates only to the selected college",async()=>{
    state.selected=true;
    await expect(AdminVerificationEntry()).rejects.toThrow(
      "EXPECTED_REDIRECT:/admin/colleges/22222222-2222-4222-8222-222222222222/verification",
    );
  });
});
