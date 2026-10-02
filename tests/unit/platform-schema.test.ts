import { describe, expect, it } from "vitest";
import { getTableName } from "drizzle-orm";
import {
  collegeMemberships,
  colleges,
  departments,
  legacyIdMap,
  membershipRoleEnum,
  organizations,
  systemRoleEnum,
  systemRoles,
  tenantDomains,
  users,
} from "@/db/schema";

describe("core platform schema", () => {
  it("uses explicit membership roles instead of faculty-type authorization", () => {
    expect(membershipRoleEnum.enumValues).toEqual([
      "LEARNER",
      "FACULTY",
      "COLLEGE_ADMIN",
      "MENTOR",
      "TPO",
    ]);
  });

  it("models super admin as a real global role", () => {
    expect(systemRoleEnum.enumValues).toEqual(["SUPER_ADMIN"]);
  });

  it("exports the expected first-batch tables", () => {
    expect([
      getTableName(organizations),
      getTableName(colleges),
      getTableName(users),
      getTableName(collegeMemberships),
      getTableName(systemRoles),
      getTableName(departments),
      getTableName(tenantDomains),
      getTableName(legacyIdMap),
    ]).toEqual([
      "organizations",
      "colleges",
      "users",
      "college_memberships",
      "system_roles",
      "departments",
      "tenant_domains",
      "legacy_id_map",
    ]);
  });
});
