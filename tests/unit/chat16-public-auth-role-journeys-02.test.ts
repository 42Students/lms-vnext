import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {safeReturnTo,sessionExpiredHref} from "@/lib/return-to";
import {recruiterInviteHref} from "@/modules/placements/recruiter-invite-alias-model";
const read=(p:string)=>readFileSync(p,"utf8");

describe("chat-16 public auth and invitation page journeys",()=>{
 it("UX-login-security-02 only preserves same-host internal return destinations",()=>{
  expect(safeReturnTo("/dashboard?tab=one")).toBe("/dashboard?tab=one");
  for(const bad of ["https://evil.example.org","//evil.example.org","/\\evil","/api/users",
   "/login","/","javascript:alert(1)"]){
   expect(safeReturnTo(bad),bad).toBeNull();
  }
  expect(sessionExpiredHref("/dashboard","expired")).toContain("returnTo=%2Fdashboard");
  expect(sessionExpiredHref("//evil.example.org","revoked")).toBe("/?auth=revoked");
 });
 it("UX-login-security-03 retains auth failure recovery without leaking raw sessions",()=>{
  const page=read("src/app/page.tsx");
  const alias=read("src/app/login/page.tsx");
  expect(page).toContain("safeReturnTo(requested)");
  expect(page).toContain('role="alert"');
  expect(page).toContain("<LoginForm");
  expect(page).toContain("Your session expired. Please log in again.");
  expect(page).toContain('requestPath !== "/login"');
  expect(alias).toContain("generateMetadata");
  expect(page).not.toContain('window.localStorage');
 });
 it("UX-legacy-auth-02 retires old cross-domain handoff and privileged test login",()=>{
  const handoff=read("src/app/auth/handoff/page.tsx");
  const oldSuper=read("src/app/superadmin-login/page.tsx");
  expect(handoff).toContain('redirect("/?auth=handoff-retired")');
  expect(oldSuper).toContain('redirect("/login")');
  expect(handoff).not.toContain("exchangeToken");
  expect(oldSuper).not.toContain("createSession");
 });
 it("UX-hr-invite-02 validates legacy invite tokens before redirecting",()=>{
  expect(recruiterInviteHref("eightChars")).toBe("/recruiter-invite/eightChars");
  expect(()=>recruiterInviteHref("../admin")).toThrow();
  expect(()=>recruiterInviteHref("https://external.example.org")).toThrow();
  expect(()=>recruiterInviteHref("short")).toThrow();
  const page=read("src/app/hr-invite/[token]/page.tsx");
  expect(page).toContain("recruiterInviteHref(token)");
  expect(page).toContain("z.ZodError");
  expect(page).toContain("notFound()");
 });
 it("UX-public-join-02 fails safely if a company or college invite preview is unavailable",()=>{
  for(const [route,scope] of [["company-join","COMPANY"],["college-join","COLLEGE"]]){
   const page=read("src/app/"+route+"/[token]/page.tsx");
   expect(page).toContain('getPublicJoinPreview(token, "'+scope+'")');
   expect(page).toContain('<PublicJoinPreviewRetry token={token} scope="'+scope+'"/>');
   expect(page).toContain('<PublicRecruiterJoinForm token={token} scope="'+scope+'"');
  }
  const retry=read("src/components/placements/public-join-preview-retry.tsx");
  expect(retry).toContain("Your invitation was not used.");
  expect(retry).toContain("encodeURIComponent(token)");
  expect(retry).toContain("min-h-11");
 });
 it("UX-campaign-unsubscribe-02 GET must never opt out without explicit POST",()=>{
  const page=read("src/app/campaign-unsubscribe/[token]/page.tsx");
  const form=read("src/components/placements/campaign-unsubscribe-confirm.tsx");
  const confirmed=read("src/app/campaign-unsubscribe/confirmed/page.tsx");
  expect(page).toContain("Opening this link does not unsubscribe you");
  expect(page).toContain("No preference was changed");
  expect(form).toContain("if(pendingRef.current)return");
  expect(form).toContain('method:"POST"');
  expect(form).toContain('credentials:"same-origin"');
  expect(form).toContain("AbortController");
  expect(form).toContain("response.redirected");
  expect(form).toContain("url.origin!==window.location.origin");
  expect(form).toContain('url.pathname!=="/campaign-unsubscribe/confirmed"');
  expect(form).toContain("That didn't work. Please try again.");
  expect(confirmed).toContain('role="status"');
 });
});
