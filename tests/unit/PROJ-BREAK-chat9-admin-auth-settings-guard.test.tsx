import {beforeEach,describe,expect,it,vi} from "vitest";
import {isValidElement} from "react";
import SuperAdminAuthSettings from "@/app/(authenticated)/admin/settings/auth/page";

const state=vi.hoisted(()=>({
  role:"ADMIN" as "ADMIN"|"COLLEGE"|"DISABLED",
}));
vi.mock("@/auth/request-context",()=>({
  getCurrentRequestContext:async()=>({
    user:{id:"admin",identityUid:"platform",
      platformStatus:state.role==="DISABLED"?"DISABLED":"ACTIVE",
      systemRoles:state.role==="COLLEGE"?[]:["SUPER_ADMIN"]},
    membership:null,adminScope:null,
  }),
}));
const textParts=(node:unknown):string[]=>{
  if(node==null||typeof node==="boolean")return [];
  if(typeof node==="string"||typeof node==="number")return [String(node)];
  if(Array.isArray(node))return node.flatMap(textParts);
  if(!isValidElement(node))return [];
  const p=node.props as Record<string,unknown>;
  return ["children","title","description","href","action"].flatMap(key=>textParts(p[key]));
};
beforeEach(()=>{state.role="ADMIN";});
describe("Super Admin last-third authentication policy guard",()=>{
  it("UX-admin-auth-settings-17 non-platform and disabled accounts get a safe return link, not policy keys",async()=>{
    for(const role of ["COLLEGE","DISABLED"] as const){
      state.role=role;
      const page=textParts(await SuperAdminAuthSettings()).join(" ");
      expect(page).toContain("Authentication settings access denied");
      expect(page).toContain("Back to dashboard");
      expect(page).not.toContain("Platform & auth policy keys");
      expect(page).not.toContain("Legacy platform and auth setting keys");
    }
  });
  it("UX-admin-auth-settings-18 the active platform operator sees posture caveats but no runtime secrets",async()=>{
    const page=textParts(await SuperAdminAuthSettings()).join(" ");
    expect(page).toContain("Authentication settings");
    expect(page).toContain("Configuration runtime status is not attested");
    expect(page).toContain("No credentials, cookie secrets");
    expect(page).not.toContain("Authentication settings access denied");
  });
});
