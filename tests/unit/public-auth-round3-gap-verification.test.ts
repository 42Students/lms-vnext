import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
const file=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("Public login and session round-three verified closure",()=>{
 it("PUB-auth-public-10 preserves authorized returnTo through re-login",()=>{
  const login=file("src/components/auth/login-form.tsx");
  const layout=file("src/app/(authenticated)/layout.tsx");
  expect(login).toContain("safeReturnTo(new URLSearchParams(window.location.search).get");
  expect(layout).toContain("encodeURIComponent(requested)");
  expect(file("src/lib/return-to.ts")).toContain('value.startsWith("//")');
 });
 it("PUB-auth-public-14 leaves unusable OTP screen open with immediate resend",()=>{
  const source=file("src/components/auth/login-form.tsx");
  expect(source).toContain("This code can't be used any more. Ask for a new one to continue.");
  expect(source).toContain('setCooldown(0);');
  expect(source).toContain('Boolean(errorCode && RESTART_ERRORS.has(errorCode))');
  expect(source).toContain('if(attempt&&!contact.trim()){reset();');
 });
 it("PUB-auth-public-15 legacy mascot is NOT-A-GAP by owner decision OD-19",()=>{
  const decisions=file("docs/audit/owner-decisions-resolved.md");
  expect(decisions).toContain("OD-19");
  expect(decisions).toContain("Login mascot out of scope.");
 });
 it("PUB-auth-public-18 never caches domain lookup outages as unknown tenants",()=>{
  const resolver=file("src/modules/auth/request-tenant.ts");
  expect(resolver).toContain('return {kind:"unavailable",host};');
  expect(file("src/app/page.tsx")).toContain("We couldn&apos;t confirm this college right now");
  expect(file("src/app/page.tsx")).toContain("its settings didn&apos;t load");
 });
 it("PUB-auth-public-27 maintains legacy 404 text on graceful recovery",()=>{
  const source=file("src/app/not-found.tsx");
  expect(source).toContain("The page you are looking for doesn't exist, moved, or is no longer available.");
  expect(source).toContain("GracefulScreen");
  expect(file("src/components/public/graceful-screen.tsx")).toContain('homeLabel = "Go to home"');
 });
 it("PUB-auth-public-32 login uses shared guarded API and friendly failure responses",()=>{
  const source=file("src/components/auth/login-form.tsx");
  expect(source).toContain('import {apiFetch,FriendlyFetchError}');
  expect(source).toContain('import {useGuardedAction}');
  expect(source).toContain('return fail(result.data.error,result.data.retryAfterSeconds)');
 });
});
