import { beforeEach, describe, expect, it, vi } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";
import type { RequestContext } from "@/modules/identity/context";

vi.mock("server-only", () => ({}));
const state = vi.hoisted(() => ({
  selectCalls: 0,
  principalPresent: true,
  contactPresent: true,
  roles: ["FACULTY"] as string[],
  selects: [] as Array<{ keys: string[]; where: { sql: string; params: unknown[] } | null }>,
}));
const personId = "11111111-1111-4111-8111-111111111111";
const collegeId = "22222222-2222-4222-8222-222222222222";
const memberId = "33333333-3333-4333-8333-333333333333";

vi.mock("@/db/client", () => ({
  getDb: () => ({
    select: (projection: Record<string, unknown>) => {
      state.selectCalls++;
      const keys = Object.keys(projection);
      const record = { keys, where: null as { sql: string; params: unknown[] } | null };
      state.selects.push(record);
      const kind = "collegeId" in projection ? "actor" :
        "membershipId" in projection ? "contact" : "roles";
      const dialect = new PgDialect();
      const chain = {
        from: () => chain,
        innerJoin: () => chain,
        leftJoin: () => chain,
        where: (condition: SQL) => {
          const query = dialect.sqlToQuery(condition);
          record.where = { sql: query.sql, params: query.params };
          return chain;
        },
        limit: async () => kind === "actor"
          ? state.principalPresent ? [{ id: memberId, collegeId }] : []
          : state.contactPresent ? [{
            membershipId: personId, displayName: "Public Faculty",
            departmentName: "CSE",
          }] : [],
        orderBy: async () => state.roles.map(role => ({ role })),
      };
      return chain;
    },
  }),
}));

import { getFacultyContactDetail } from "@/modules/courses/faculty-contacts-service";

const context = (): RequestContext => ({
  user: {
    id: "44444444-4444-4444-8444-444444444444",
    identityUid: "faculty", platformStatus: "ACTIVE", systemRoles: [],
  },
  membership: {
    id: memberId, collegeId, organizationId: "55555555-5555-4555-8555-555555555555",
    status: "ACTIVE", roles: ["FACULTY"],
  },
});
const query = (contactsTab: "allContacts" | "teachers" | "students" = "teachers") =>
  ({ membershipId: personId, contactsTab });

beforeEach(() => {
  state.selectCalls = 0;
  state.principalPresent = true;
  state.contactPresent = true;
  state.roles = ["FACULTY"];
  state.selects = [];
});

describe("FAC-CONTACTS-DETAIL-01 authorized public contact detail", () => {
  it("returns only directory-safe names, department and roles for one persisted current-college membership", async () => {
    const response = await getFacultyContactDetail(context(), query());
    expect(response).toMatchObject({
      membershipId: personId, displayName: "Public Faculty", departmentName: "CSE",
      roles: ["FACULTY"], contactsTab: "teachers",
    });
    expect(JSON.stringify(response)).not.toMatch(/email|phone|identityUid|session|token/i);
    const detail = state.selects.find(item => item.keys.includes("membershipId"));
    expect(detail?.where?.params).toContain(personId);
    expect(detail?.where?.params).toContain(collegeId);
    expect(detail?.keys).toEqual(["membershipId", "displayName", "departmentName"]);
  });

  it("blocks a direct URL into a different tab when the contact lacks that role", async () => {
    await expect(getFacultyContactDetail(context(), query("students")))
      .rejects.toMatchObject({ code: "FACULTY_TEACHING_SCOPE_REQUIRED" });
    expect(state.selectCalls).toBe(3);
  });

  it("hides unknown/foreign membership, revoked Faculty grant and banned Faculty before returning any contact", async () => {
    state.contactPresent = false;
    await expect(getFacultyContactDetail(context(), query()))
      .rejects.toMatchObject({ code: "FACULTY_TEACHING_SCOPE_REQUIRED" });
    state.contactPresent = true;
    state.principalPresent = false;
    await expect(getFacultyContactDetail(context(), query()))
      .rejects.toMatchObject({ code: "FACULTY_TEACHING_SCOPE_REQUIRED" });

    const inactive = { ...context(), user: {
      ...context().user, platformStatus: "DISABLED" as const,
    } };
    state.selectCalls = 0;
    await expect(getFacultyContactDetail(inactive, query()))
      .rejects.toMatchObject({ code: "FACULTY_TEACHING_SCOPE_REQUIRED" });
    expect(state.selectCalls).toBe(0);
  });

  it("rejects forged, missing or malformed membership and tab selectors before an actor/database query", async () => {
    for (const bad of [
      { contactsTab: "teachers", membershipId: "invalid" },
      { contactsTab: "admins", membershipId: personId },
      { contactsTab: "teachers", membershipId: personId, collegeId: "other" },
    ]) await expect(getFacultyContactDetail(context(), bad)).rejects.toThrow();
    expect(state.selectCalls).toBe(0);
  });
});
