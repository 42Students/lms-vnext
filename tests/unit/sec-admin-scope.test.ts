import { describe, expect, it } from "vitest";
import { scopeFromActor } from "@/db/tenant-context";
import {
  ADMIN_SCOPE_MAX_AGE_SECONDS,
  adminScopeExpired,
  decodeAdminScopeCookie,
  encodeAdminScopeCookie,
} from "@/auth/admin-scope";

/**
 * The admin scope is a cookie the browser sends back. Only a Super Admin who has not entered a college workspace may use it, and
 * only inside its time window. Everyone else's cookie must change nothing: not the context, and above all not the college the
 * database isolates them to.
 */
const ORG = "11111111-1111-4111-8111-111111111111";
const COLLEGE_X = "22222222-2222-4222-8222-222222222222";
const COLLEGE_OWN = "33333333-3333-4333-8333-333333333333";
const scope = { organizationId: ORG, collegeId: COLLEGE_X };

describe("the database college for a request", () => {
  it("a person with no workspace selected and no platform role gets no college from the cookie", () => {
    const derived = scopeFromActor({ user: { id: "u1", systemRoles: [] }, membership: null, adminScope: scope });
    expect(derived.collegeId).toBeNull();
    expect(derived.platform).toBe(false);
    expect(derived.role).toBeNull();
  });

  it("a Super Admin acting at platform level may be narrowed to a college by the cookie", () => {
    const derived = scopeFromActor({ user: { id: "u2", systemRoles: ["SUPER_ADMIN"] }, membership: null, adminScope: scope });
    expect(derived.collegeId).toBe(COLLEGE_X);
    expect(derived.platform).toBe(true);
    expect(derived.role).toBe("SUPER_ADMIN");
  });

  it("a selected workspace always wins over the cookie, for everyone", () => {
    const membership = { collegeId: COLLEGE_OWN, roles: ["LEARNER"] as const };
    expect(scopeFromActor({ user: { id: "u3", systemRoles: [] }, membership, adminScope: scope }).collegeId).toBe(COLLEGE_OWN);
    expect(scopeFromActor({ user: { id: "u4", systemRoles: ["SUPER_ADMIN"] }, membership, adminScope: scope }).collegeId).toBe(COLLEGE_OWN);
  });

  it("an organization-wide scope never names a college", () => {
    const derived = scopeFromActor({ user: { id: "u5", systemRoles: ["SUPER_ADMIN"] }, membership: null, adminScope: { organizationId: ORG, collegeId: null } });
    expect(derived.collegeId).toBeNull();
  });
});

describe("the admin scope time window", () => {
  const now = 1_800_000_000_000;
  const inSeconds = (n: number) => String(Math.floor(now / 1000) + n);

  it("is honoured only while it is still in the future and within the maximum window", () => {
    expect(adminScopeExpired(inSeconds(60), now)).toBe(false);
    expect(adminScopeExpired(inSeconds(ADMIN_SCOPE_MAX_AGE_SECONDS), now)).toBe(false);
  });

  it("expires when missing, past, malformed, or tampered far into the future", () => {
    for (const value of [undefined, null, "", "0", "-5", "abc", "12.5", "1e9", "NaN", " 1800000100", "1800000100 ", "99999999999999",
      inSeconds(-1), inSeconds(0), inSeconds(ADMIN_SCOPE_MAX_AGE_SECONDS + 3600), inSeconds(10 * 365 * 24 * 3600)]) {
      expect(adminScopeExpired(value as string | null | undefined, now), String(value)).toBe(true);
    }
  });
});

describe("decoding the scope cookie", () => {
  it("round-trips a valid organization or college scope", () => {
    expect(decodeAdminScopeCookie(encodeAdminScopeCookie(scope))).toEqual(scope);
    const orgOnly = { organizationId: ORG, collegeId: null };
    expect(decodeAdminScopeCookie(encodeAdminScopeCookie(orgOnly))).toEqual(orgOnly);
  });

  it("rejects anything that is not exactly an organization or a college of valid ids", () => {
    for (const value of [
      undefined, null, "", "college", "college:", `college:${ORG}`, `college:${ORG}:${COLLEGE_X}:extra`, `organization:${ORG}:${COLLEGE_X}`,
      "organization:not-a-uuid", `college:${ORG}:not-a-uuid`, `COLLEGE:${ORG}:${COLLEGE_X}`, `platform:${ORG}`,
      `college:${ORG}:${COLLEGE_X}\n`, ` college:${ORG}:${COLLEGE_X}`, `college:${ORG};${COLLEGE_X}`, "*", "all", "../../etc/passwd",
    ]) {
      expect(decodeAdminScopeCookie(value as string | null | undefined), String(value)).toBeNull();
    }
  });
});
