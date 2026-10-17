import {describe,expect,it} from "vitest";
import {ATTEMPT_LIFETIME_SECONDS,SEND_WINDOW_MINUTES} from "@/modules/auth/login-service";
import {readFileSync} from "node:fs";
describe("Super Admin OTP lockout decision",()=>{
  it("SA-academics-people-86 intentionally uses expiring throttles rather than a dangerous bypass action",()=>{
    expect(ATTEMPT_LIFETIME_SECONDS).toBe(300);
    expect(SEND_WINDOW_MINUTES).toBe(10);
    const scope=readFileSync("docs/audit/owner-decisions-resolved.md","utf8");
    expect(scope).toContain("no impersonation");
    const schema=readFileSync("src/modules/auth/login-service.ts","utf8");
    expect(schema).toContain("TOO_MANY_REQUESTS");
    expect(schema).toContain("OTP_EXPIRED");
  });
});
