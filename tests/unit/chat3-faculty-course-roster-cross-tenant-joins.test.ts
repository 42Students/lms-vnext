import { beforeEach, describe, expect, it, vi } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";
import type { RequestContext } from "@/modules/identity/context";

const state = vi.hoisted(() => ({
  queries: 0,
  joins: [] as Array<{ sql: string; params: unknown[] }>,
  where: null as { sql: string; params: unknown[] } | null,
}));
vi.mock("@/db/client", () => ({
  getDb: () => ({
    select: () => {
      state.queries++;
      const dialect = new PgDialect();
      class Query {
        from() { return this; }
        innerJoin(_table: unknown, expression: SQL) {
          const compiled = dialect.sqlToQuery(expression);
          state.joins.push({ sql: compiled.sql, params: compiled.params });
          return this;
        }
        where(expression: SQL) {
          const compiled = dialect.sqlToQuery(expression);
          state.where = { sql: compiled.sql, params: compiled.params };
          return this;
        }
        async orderBy() { return []; }
      }
      return new Query();
    },
  }),
}));

import { listFacultyCourseDeliveries } from "@/modules/courses/faculty-course-service";

const collegeId = "11111111-1111-4111-8111-111111111111";
const organizationId = "22222222-2222-4222-8222-222222222222";

function actor(): RequestContext {
  return {
    user: { id: "33333333-3333-4333-8333-333333333333",
      identityUid: "fac", platformStatus: "ACTIVE", systemRoles: [] },
    membership: { id: "44444444-4444-4444-8444-444444444444",
      collegeId, organizationId, status: "ACTIVE", roles: ["FACULTY"] },
  };
}
beforeEach(() => {
  state.queries = 0;
  state.joins = [];
  state.where = null;
});

describe("FAC-TENANT-COURSES-01 persisted Faculty course directory joins", () => {
  it("ties course department, Section cohort and academic period to one selected college", async () => {
    await expect(listFacultyCourseDeliveries(actor())).resolves.toEqual([]);
    expect(state.queries).toBe(1);
    const source = state.joins.map(join => join.sql).join("\n");
    expect(source).toContain('"faculty_cohort_departments"."college_id"');
    expect(source).toContain('"academic_periods"."college_id"');
    expect(source).toContain('"sections"."cohort_id"');
    expect(source).toContain('"course_offerings"."cohort_id"');
    expect(source).toContain('"sections"."academic_period_id"');
    expect(source).toContain('"course_offerings"."academic_period_id"');

    const tenants = state.joins.flatMap(join => join.params);
    expect(tenants.filter(value => value === collegeId).length).toBeGreaterThanOrEqual(3);
    expect(state.where?.params).toContain(actor().membership?.id);
  });

  it("denies Mentor, Learner, inactive Faculty and a disabled account before querying SQL", async () => {
    const original = actor();
    const blocked: RequestContext[] = [
      { ...original, membership: { ...original.membership!, roles: ["MENTOR"] } },
      { ...original, membership: { ...original.membership!, roles: ["LEARNER"] } },
      { ...original, membership: { ...original.membership!, status: "SUSPENDED" } },
      { ...original, user: { ...original.user, platformStatus: "DISABLED" } },
      { ...original, membership: null },
    ];
    for (const context of blocked) {
      await expect(listFacultyCourseDeliveries(context))
        .rejects.toMatchObject({ code: "FACULTY_TEACHING_SCOPE_REQUIRED" });
    }
    expect(state.queries).toBe(0);
  });
});
