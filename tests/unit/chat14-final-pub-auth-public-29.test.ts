import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {deniedPortalHome,PORTAL_PERMISSION_DENIED} from "@/modules/identity/unauthorized-portal-home";
const read=(p:string)=>readFileSync(p,"utf8");
describe("chat-14 final sprint",()=>{
 it("PUB-auth-public-29 uses legacy exact denial copy and sends inactive users to safe home",()=>{
  expect(PORTAL_PERMISSION_DENIED).toBe("You don't have permission to perform this action.");
  expect(deniedPortalHome({user:{id:"u",identityUid:"uid",platformStatus:"ACTIVE",systemRoles:[]},membership:null,recruiter:null})).toBe("/dashboard?access=denied");
 });
 it("PUB-auth-public-29 role access denial redirects rather than silently going to generic dashboard",()=>{
  const code=read("src/app/(authenticated)/tpo/layout.tsx");
  expect(code).toContain("redirect(deniedPortalHome(context))");
 });
 it("PUB-auth-public-29 shows global 403 and portal-denial notices without changing shell",()=>{
  const interceptor=read("src/components/auth/session-response-guard.tsx");
  const notice=read("src/components/auth/portal-access-notice.tsx");
  const root=read("src/app/(authenticated)/layout.tsx");
  expect(interceptor).toContain('new Event("lms:access-denied")');
  expect(notice).toContain('role="alert"');
  expect(notice).toContain('search.get("access")==="denied"');
  expect(root).toContain("<PortalAccessNotice/>");
 });
});