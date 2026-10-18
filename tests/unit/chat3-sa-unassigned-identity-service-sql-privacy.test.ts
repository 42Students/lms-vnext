import { beforeEach, describe, expect, it, vi } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";
import type { RequestContext } from "@/modules/identity/context";

vi.mock("server-only", () => ({}));
const state = vi.hoisted(() => ({
  selects: 0,
  predicates: [] as Array<{ sql: string; params: unknown[] }>,
  selections: [] as string[][],
}));
vi.mock("@/db/client", () => ({
  getDb: () => ({
    select: (projection: Record<string, unknown>) => {
      state.selects++;
      const fields = Object.keys(projection);
      state.selections.push(fields);
      class Query {
        from() { return this; }
        where(condition: SQL) {
          const compiled = new PgDialect().sqlToQuery(condition);
          state.predicates.push({ sql: compiled.sql, params: compiled.params });
          return this;
        }
        orderBy() { return this; }
        limit() { return this; }
        async offset() { return []; }
        then<TResult1 = unknown>(
          resolve: (value: Array<{ total: number }>) => TResult1 | PromiseLike<TResult1>,
        ) {
          return Promise.resolve(resolve("total" in projection ? [{ total: 0 }] : []));
        }
      }
      return new Query();
    },
  }),
}));
import {
  listSuperAdminUnassignedUsers,
} from "@/modules/people/admin-unassigned-user-service";
const orgId = "11111111-1111-4111-8111-111111111111";
const collegeId = "22222222-2222-4222-8222-222222222222";
function superAdmin(): RequestContext {
  return {
    user: { id: "33333333-3333-4333-8333-333333333333",
      identityUid: "root", platformStatus: "ACTIVE", systemRoles: ["SUPER_ADMIN"] },
    membership: null, adminScope: null,
  };
}
beforeEach(() => {
  state.selects = 0;
  state.predicates = [];
  state.selections = [];
});
describe("SA3-UNASSIGNED-IDENTITY-SQL-01 global no-membership and private contacts", () => {
  it("denies Faculty, Mentor, Learner, disabled root and selected tenant scope without database reads", async () => {
    const original = superAdmin();
    const blocked = [
      ...(["FACULTY", "MENTOR", "LEARNER"] as const).map(role => ({
        ...original,
        user: { ...original.user, systemRoles: [] },
        membership: { id: "member", collegeId, organizationId: orgId,
          status: "ACTIVE" as const, roles: [role] },
      })),
      { ...original, user: { ...original.user, platformStatus: "DISABLED" as const } },
      { ...original, adminScope: { organizationId: orgId, collegeId } },
      { ...original, adminScope: { organizationId: orgId, collegeId: null } },
    ];
    for (const actor of blocked) {
      await expect(listSuperAdminUnassignedUsers(actor, {})).rejects.toThrow();
    }
    expect(state.selects).toBe(0);
  });

  it("uses NOT EXISTS against all college memberships, even suspended or ended ones", async () => {
    const result = await listSuperAdminUnassignedUsers(superAdmin(), {});
    expect(result).toMatchObject({
      total: 0, totalPages: 1, page: 1, items: [],
    });
    const sql = state.predicates.map(predicate => predicate.sql.toLowerCase()).join("\n");
    expect(sql).toContain("not exists");
    expect(sql).toContain("college_memberships");
    expect(sql).toContain("user_id");
    const mainProjection = state.selections.find(fields =>
      fields.includes("displayName") && fields.includes("platformStatus"));
    expect(mainProjection).toEqual(expect.arrayContaining([
      "id", "displayName", "platformStatus", "createdAt", "updatedAt",
    ]));
    expect(mainProjection).not.toContain("email");
    expect(mainProjection).not.toContain("phoneE164");
    expect(mainProjection).not.toContain("password");
    expect(mainProjection).not.toContain("session");
  });

  it("strictly rejects forged contact filters before building the directory", async () => {
    await expect(listSuperAdminUnassignedUsers(superAdmin(), {
      role: "SUPER_ADMIN", collegeId,
    })).rejects.toThrow();
    await expect(listSuperAdminUnassignedUsers(superAdmin(), { q: "x".repeat(101) }))
      .rejects.toThrow();
    expect(state.selects).toBe(0);
  });

  it("only queries system role facts when the unassigned role filter explicitly requests them", async () => {
    await listSuperAdminUnassignedUsers(superAdmin(), { role: "SUPER_ADMIN" });
    const sql = state.predicates.map(predicate => predicate.sql.toLowerCase()).join("\n");
    expect(sql).toContain("not exists");
    expect(sql).toContain("exists");
    expect(sql).toContain("system_roles");
  });
});
