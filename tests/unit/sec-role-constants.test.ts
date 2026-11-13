import { describe, expect, it } from "vitest";
import { MEMBERSHIP_ROLES, SYSTEM_ROLES } from "@/modules/identity/constants";
import { ROLE, isMembershipRoleName, isSystemRoleName } from "@/modules/identity/roles";

describe("ROLE constant", () => {
  it("names every membership and system role exactly once, spelled as the stored value", () => {
    expect(Object.keys(ROLE).sort()).toEqual([...MEMBERSHIP_ROLES, ...SYSTEM_ROLES].sort());
    for (const [key, value] of Object.entries(ROLE)) expect(value).toBe(key);
    expect(Object.isFrozen(ROLE)).toBe(true);
  });
  it("recognises only real role names", () => {
    expect(isMembershipRoleName("TPO")).toBe(true);
    expect(isMembershipRoleName("SUPER_ADMIN")).toBe(false);
    expect(isSystemRoleName("SUPER_ADMIN")).toBe(true);
    expect(isMembershipRoleName("tpo")).toBe(false);
    expect(isMembershipRoleName(undefined)).toBe(false);
  });
});
