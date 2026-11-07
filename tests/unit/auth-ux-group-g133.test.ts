import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {loginRetryWindowIst} from "@/modules/auth/login-retry-time-model";

const src=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");

describe("UX-G133 sign-in and device management",()=>{
 it("renders a concrete IST retry estimate only for valid server intervals",()=>{
  const now=new Date("2026-11-07T18:29:50.000Z");
  expect(loginRetryWindowIst(now,10)?.seconds).toBe(10);
  expect(loginRetryWindowIst(now,3600)?.seconds).toBe(3600);
  expect(loginRetryWindowIst(now,0)).toBeNull();
  expect(loginRetryWindowIst(now,3601)).toBeNull();
  expect(loginRetryWindowIst(now,Number.NaN)).toBeNull();
 });
 it("prevents immediate resend during a server-enforced retry window",()=>{
  const ui=src("src/components/auth/login-form.tsx");
  expect(ui).toContain('errorCode==="TOO_MANY_REQUESTS"');
  expect(ui).toContain('errorCode==="OTP_ATTEMPTS_EXCEEDED"');
  expect(ui).toContain('disabled={busy || retryBlocked}');
  expect(ui).toContain('"Try again in "+Math.floor(cooldown/60)');
  expect(ui).toContain("loginRetryWindowIst(new Date(),safeRetry)");
  expect(ui).toContain("setCooldown(safeRetry ?? 0)");
 });
 it("shows the issued code lifetime and lets correction clear stale feedback",()=>{
  const ui=src("src/components/auth/login-form.tsx");
  expect(ui).toContain('Math.ceil(result.data.expiresInSeconds/60)');
  expect(ui).toContain("setCode(event.target.value.replace(");
  expect(ui).toContain("setSecondCode(event.target.value.replace(");
  expect((ui.match(/setErrorCode\(null\);/g)??[]).length).toBeGreaterThan(2);
  expect(ui).toContain("aria-invalid={Boolean(contactError)}");
 });
 it("preserves tenant-and-host scoping for interrupted login attempts",()=>{
  const ui=src("src/components/auth/login-form.tsx");
  expect(ui).toContain("record.host !== window.location.host.toLowerCase()");
  expect(ui).toContain("record.tenantKey !== tenantKey");
  expect(ui).toContain("safeReturnTo(");
 });
 it("explains stale sessions without showing a false sign-out success",()=>{
  const ui=src("src/components/auth/device-list.tsx");
  expect(ui).toContain('method: "DELETE", credentials: "same-origin"');
  expect(ui).toContain("response.status === 401");
  expect(ui).toContain("response.status === 404 || response.status === 409");
  expect(ui).toContain("router.replace(\"/login\")");
  expect(ui).toContain("router.refresh()");
  expect(ui).toContain("ConfirmDialog");
 });
});
