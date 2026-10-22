import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {loginRetryWindowIst} from "@/modules/auth/login-retry-time-model";

describe("G2-18-019-010: verified temporary OTP retry window",()=>{
 it("renders an IST clock estimate from an explicit server Retry-After interval",()=>{
  const result=loginRetryWindowIst(new Date("2026-10-22T08:00:00.000Z"),90);
  expect(result).not.toBeNull();
  expect(result?.seconds).toBe(90);
  expect(result?.timeIst).toContain("Oct");
  expect(result?.timeIst).toContain("2026");
  expect(loginRetryWindowIst(new Date(Number.NaN),90)).toBeNull();
  expect(loginRetryWindowIst(new Date(),Number.POSITIVE_INFINITY)).toBeNull();
  expect(loginRetryWindowIst(new Date(),0)).toBeNull();
 });
 it("preserves server-enforced cooldown while offering a visible retry clock",()=>{
  const source=readFileSync("src/components/auth/login-form.tsx","utf8");
  expect(source).toContain("loginRetryWindowIst(new Date(),safeRetry)");
  expect(source).toContain("server rechecks the limit");
  expect(source).toContain("setCooldown(Math.max(cooldown,safeRetry))");
 });
});
