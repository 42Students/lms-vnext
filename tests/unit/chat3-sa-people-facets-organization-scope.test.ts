import { beforeEach, describe, expect, it, vi } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";
import type { RequestContext } from "@/modules/identity/context";

vi.mock("server-only", () => ({}));
const state = vi.hoisted(() => ({
  selects: 0,
  joins: [] as Array<{ sql: string; params: unknown[] }>,
  limits: [] as number[],
}));
vi.mock("@/db/client", () => ({
  getDb: () => ({
    select: () => {
      state.selects++;
      const dialect = new PgDialect();
      class Query {
        from() { return this; }
        innerJoin(_table: unknown, condition: SQL) {
          const query = dialect.sqlToQuery(condition);
          state.joins.push({ sql: query.sql, params: query.params });
          return this;
        }
        where() { return this; }
        orderBy() { return this; }
        async limit(n: number) {
          state.limits.push(n);
          return [];
        }
      }
      return new Query();
    },
  }),
}));

import {
  getSuperAdminPeopleFilterOptions,
} from "@/modules/admin-ui/super-admin-people-filter-options";

const collegeId = "11111111-1111-4111-8111-111111111111";
const orgId = "22222222-2222-4222-8222-222222222222";
const userId = "33333333-3333-4333-8333-333333333333";
function admin(): RequestContext {
  return {
    user: { id: userId, identityUid: "sa", platformStatus: "ACTIVE",
      systemRoles: ["SUPER_ADMIN"] },
    membership: null,
    adminScope: { organizationId: orgId, collegeId },
  };
}

beforeEach(() => {
  state.selects = 0;
  state.joins = [];
  state.limits = [];
});

describe("SA3-PEOPLE-ORG-01 People facet tenant ownership", () => {
  it("adds a persisted college and organization guard to every faculty, program, batch and class facet", async () => {
    await expect(getSuperAdminPeopleFilterOptions(admin())).resolves.toEqual({
      departments: [], programs: [], batches: [], classes: [],
    });
    expect(state.selects).toBe(4);
    expect(state.limits).toEqual([500, 1000, 2000, 2000]);
    const collegeJoins = state.joins.filter(p => p.sql.includes('"colleges"."id"'));
    expect(collegeJoins).toHaveLength(4);
    for (const join of collegeJoins) {
      expect(join.sql).toContain('"colleges"."organization_id"');
      expect(join.params).toContain(collegeId);
      expect(join.params).toContain(orgId);
    }
  });

  it("denies Learner, Mentor, Faculty, disabled administrator and no selected college before opening any DB query", async () => {
    const base = admin();
    const blocked: RequestContext[] = [
      { ...base, user: { ...base.user, platformStatus: "DISABLED" } },
      { ...base, adminScope: { organizationId: orgId, collegeId: null } },
      ...(["LEARNER", "MENTOR", "FACULTY"] as const).map(role => ({
        ...base,
        user: { ...base.user, systemRoles: [] },
        membership: { id: "member", collegeId, organizationId: orgId,
          status: "ACTIVE" as const, roles: [role] },
      })),
    ];
    for (const principal of blocked) {
      await expect(getSuperAdminPeopleFilterOptions(principal))
        .rejects.toThrow("Missing permission: people.manage");
    }
    expect(state.selects).toBe(0);
  });

  it("retains college ownership restrictions even in an intentionally global organization selection", async () => {
    const context = admin();
    context.adminScope = { collegeId, organizationId: null };
    await getSuperAdminPeopleFilterOptions(context);
    const collegeJoins = state.joins.filter(p => p.sql.includes('"colleges"."id"'));
    expect(collegeJoins).toHaveLength(4);
    for (const join of collegeJoins) {
      expect(join.params).toContain(collegeId);
      expect(join.params).not.toContain(orgId);
    }
  });
});
