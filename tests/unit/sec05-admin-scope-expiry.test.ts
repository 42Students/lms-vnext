import { describe, expect, it } from "vitest";
import { ADMIN_SCOPE_MAX_AGE_SECONDS, adminScopeExpired } from "@/auth/admin-scope";

// SEC-05-022: a Super Admin scope is honoured only inside a server-checked window.
describe("admin scope expiry", () => {
  const now = Date.UTC(2026, 10, 7, 12, 0, 0);
  const sec = (offset: number) => String(Math.floor(now / 1000) + offset);
  it("is expired when the value is missing or malformed", () => {
    for (const v of [undefined, null, "", "abc", "-5", "1.5", "12345678901234"]) expect(adminScopeExpired(v, now)).toBe(true);
  });
  it("is valid inside the window", () => {
    expect(adminScopeExpired(sec(60), now)).toBe(false);
    expect(adminScopeExpired(sec(ADMIN_SCOPE_MAX_AGE_SECONDS), now)).toBe(false);
  });
  it("is expired once the time has passed", () => {
    expect(adminScopeExpired(sec(0), now)).toBe(true);
    expect(adminScopeExpired(sec(-1), now)).toBe(true);
  });
  it("treats a tampered far-future expiry as expired", () => {
    expect(adminScopeExpired(sec(ADMIN_SCOPE_MAX_AGE_SECONDS + 3600), now)).toBe(true);
  });
});
