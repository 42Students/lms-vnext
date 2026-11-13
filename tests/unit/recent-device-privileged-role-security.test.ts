import { describe, expect, it } from "vitest";
import {
  isRecentDeviceAuthentication,
  PRIVILEGED_AUTH_MAX_AGE_SECONDS,
} from "@/auth/recent-device-auth";
import { readFileSync } from "node:fs";

describe("recent first-party OTP authentication for privileged role grants", () => {
  const now = new Date("2026-11-04T12:00:00.000Z");

  it("accepts a fresh real session but not a nearly ten-minute-old one", () => {
    expect(isRecentDeviceAuthentication(new Date(now.getTime() - 2 * 60_000), now)).toBe(true);
    expect(isRecentDeviceAuthentication(new Date(now.getTime() - 9 * 60_000), now)).toBe(true);
    expect(isRecentDeviceAuthentication(new Date(now.getTime() - PRIVILEGED_AUTH_MAX_AGE_SECONDS * 1000), now)).toBe(false);
    expect(isRecentDeviceAuthentication(new Date(now.getTime() - 24 * 60_000), now)).toBe(false);
  });

  it("denies invalid, missing and future authentication claims", () => {
    for (const createdAt of [null, undefined, "", "not-a-date", new Date(now.getTime() + 1000)]) {
      expect(isRecentDeviceAuthentication(createdAt, now)).toBe(false);
    }
    expect(isRecentDeviceAuthentication(now, now, 0)).toBe(false);
    expect(isRecentDeviceAuthentication(now, now, Number.NaN)).toBe(false);
    expect(isRecentDeviceAuthentication(now, now, 3600)).toBe(false);
  });

  it("also guards privileged role grants hidden in new-person onboarding", () => {
    const source = readFileSync("src/app/api/people/onboard/route.ts", "utf8");
    const call = source.indexOf("onboardPersonWithRuntime(context, body");
    expect(call).toBeGreaterThan(0);
    const guards = source.slice(Math.max(0, call - 900), call);
    expect(guards).toContain("onboardPersonInputSchema.parse(body)");
    expect(guards).toContain('role === ROLE.COLLEGE_ADMIN || role === ROLE.TPO');
    expect(guards).toContain('requirePermission(context, "admin-scope.select")');
    expect(guards).toContain("await requireRecentDeviceAuthentication(context.user.id)");
  });

  it("guards both granting and removal of college admin or TPO role", () => {
    const source = readFileSync("src/app/api/people/[membershipId]/roles/route.ts", "utf8");
    for (const method of ["addMembershipRoleWithRuntime", "removeMembershipRoleWithRuntime"]) {
      const end = source.indexOf(method + "(");
      expect(end).toBeGreaterThan(0);
      // The branch must make fresh sign-in mandatory before the privileged
      // mutation call, rather than after it has already changed a role.
      const prefix = source.slice(Math.max(0, end - 600), end);
      expect(prefix).toContain('input.role === ROLE.COLLEGE_ADMIN || input.role === ROLE.TPO');
      expect(prefix).toContain('requirePermission(context, "admin-scope.select")');
      expect(prefix).toContain("await requireRecentDeviceAuthentication(context.user.id)");
    }
  });
});
