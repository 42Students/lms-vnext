import {beforeEach,describe,expect,it,vi} from "vitest";
import {notFound,redirect} from "next/navigation";
import LegacySuperAdminLoginPage from "@/app/superadmin-login/page";
import LegacySuperAdminE2ELoginPage from "@/app/e2e/superadmin-login/page";
import RetiredHandoffPage from "@/app/auth/handoff/page";
import LegacyHrInvite from "@/app/hr-invite/[token]/page";
import PrivacyPolicyPage,{metadata as privacyMetadata} from "@/app/privacy-policy/page";

vi.mock("next/navigation",()=>({
 redirect:vi.fn((href:string)=>{throw new Error("REDIRECT:"+href);}),
 notFound:vi.fn(()=>{throw new Error("NOT_FOUND");}),
}));
beforeEach(()=>vi.clearAllMocks());

describe("chat-16 legacy authentication and HR invite actual page routes",()=>{
 it("UX-chat16-legacy-auth-alias-16 retires all Super Admin bypass bookmarks into shared sign-in",()=>{
  expect(()=>LegacySuperAdminLoginPage()).toThrow("REDIRECT:/");
  expect(()=>LegacySuperAdminE2ELoginPage()).toThrow("REDIRECT:/");
  expect(redirect).toHaveBeenNthCalledWith(1,"/");
  expect(redirect).toHaveBeenNthCalledWith(2,"/");
  expect(notFound).not.toHaveBeenCalled();
 });
 it("UX-chat16-legacy-auth-handoff-17 never exchanges a cross-domain token on old handoff route",()=>{
  expect(()=>RetiredHandoffPage()).toThrow("REDIRECT:/?auth=handoff-retired");
  expect(redirect).toHaveBeenCalledExactlyOnceWith("/?auth=handoff-retired");
  expect(notFound).not.toHaveBeenCalled();
 });
 it("UX-chat16-privacy-policy-20 always redirects to the full public privacy statement, not a sign-in wall",()=>{
  expect(privacyMetadata.title).toBe("Privacy | 42LMS");
  expect(()=>PrivacyPolicyPage()).toThrow("REDIRECT:/assets/static/privacy-policy-view.html");
  expect(redirect).toHaveBeenCalledExactlyOnceWith("/assets/static/privacy-policy-view.html");
  expect(notFound).not.toHaveBeenCalled();
 });
 it("UX-chat16-legacy-hr-invite-18 maps only a validated opaque token to the live public invite URL",async()=>{
  await expect(LegacyHrInvite({params:Promise.resolve({token:"AbCd1234_-~."})}))
   .rejects.toThrow("REDIRECT:/recruiter-invite/AbCd1234_-~.");
  expect(redirect).toHaveBeenCalledExactlyOnceWith("/recruiter-invite/AbCd1234_-~.");
  expect(notFound).not.toHaveBeenCalled();
 });
 it("UX-chat16-legacy-hr-invite-19 denies traversal, scheme, separators and short tokens before redirect",async()=>{
  for(const token of ["../admin","/evil.test","https://evil.example.org",
   "a","two paths","ab%2Fadmin","a".repeat(513)]){
   await expect(LegacyHrInvite({params:Promise.resolve({token})}))
    .rejects.toThrow("NOT_FOUND");
  }
  expect(redirect).not.toHaveBeenCalled();
  expect(notFound).toHaveBeenCalledTimes(7);
 });
});
