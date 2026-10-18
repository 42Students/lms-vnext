import { beforeEach, describe, expect, it, vi } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";
import type { RequestContext } from "@/modules/identity/context";

vi.mock("server-only", () => ({}));
const state = vi.hoisted(() => ({
  selects: 0,
  count: 0,
  rows: [] as Array<Record<string, unknown>>,
  offset: -1,
  pageSize: -1,
  joins: [] as Array<{ sql: string; params: unknown[] }>,
  filters: [] as Array<{ sql: string; params: unknown[] }>,
}));
vi.mock("@/db/client", () => ({
  getDb: () => ({
    select: (projection?: Record<string, unknown>) => {
      state.selects++;
      const dialect = new PgDialect();
      const sqlPart = (expression: SQL) => {
        const q = dialect.sqlToQuery(expression);
        return { sql: q.sql, params: q.params };
      };
      if (projection && "teacherName" in projection) {
        const source = {
          innerJoin: (_table: unknown, condition: SQL) => {
            state.joins.push(sqlPart(condition));
            return source;
          },
          where: (condition: SQL | undefined) => {
            if (condition) state.filters.push(sqlPart(condition));
            return source;
          },
          as: () => ({
            teacherName: projection.teacherName,
            courseName: projection.courseName,
            id: projection.id,
          }),
        };
        return { from: () => source };
      }
      if (projection && "total" in projection) {
        return { from: async () => [{ total: state.count }] };
      }
      if (projection && "name" in projection) {
        const source = {
          innerJoin: (_table: unknown, condition: SQL) => {
            state.joins.push(sqlPart(condition));
            return source;
          },
          orderBy: () => ({ limit: async () => [] }),
        };
        return { from: () => source };
      }
      return {
        from: () => ({
          orderBy: () => ({
            limit: (pageSize: number) => ({
              offset: async (value: number) => {
                state.offset = value;
                state.pageSize = pageSize;
                return state.rows.slice(value, value + pageSize);
              },
            }),
          }),
        }),
      };
    },
  }),
}));

import {
  getSuperAdminFacultyAssignmentClasses,
  listAdminFacultyAssignments,
} from "@/modules/admin-ui/super-admin-faculty-assignments-service";

const collegeId = "11111111-1111-4111-8111-111111111111";
const organizationId = "22222222-2222-4222-8222-222222222222";
function principal(): RequestContext {
  return {
    user: {
      id: "33333333-3333-4333-8333-333333333333",
      identityUid: "sa",
      platformStatus: "ACTIVE",
      systemRoles: ["SUPER_ADMIN"],
    },
    membership: null,
    adminScope: { collegeId, organizationId },
  };
}
const item = (n: number) => ({
  id: "assignment-" + n,
  teacherName: "Faculty " + n,
  courseName: "CSE",
  courseCode: "101",
  sectionName: "A",
  periodName: "Term",
  periodYear: "2099-01-01",
  role: "PRIMARY",
  startedAt: new Date("2099-01-01T00:00:00.000Z"),
  teachingEnded: null,
  deliveryEnded: null,
});
beforeEach(() => {
  state.selects = 0;
  state.count = 0;
  state.rows = [];
  state.offset = -1;
  state.pageSize = -1;
  state.joins = [];
  state.filters = [];
});

describe("SA3-FAC-ASSIGNMENTS-01 scoped assignment directory and facets", () => {
  it("limits assignment joins to one college and a Section matching the course offering cohort and term", async () => {
    state.count = 1;
    state.rows = [item(1)];
    const result = await listAdminFacultyAssignments(principal(), {});
    expect(result).toMatchObject({ total: 1, totalPages: 1 });
    expect(result.items).toHaveLength(1);
    const joined = state.joins.map(p => p.sql).join("\n");
    expect(joined).toContain('"sections"."cohort_id"');
    expect(joined).toContain('"course_offerings"."cohort_id"');
    expect(joined).toContain('"sections"."academic_period_id"');
    expect(joined).toContain('"course_offerings"."academic_period_id"');
    expect(joined).toContain('"admin_faculty_section_department"."college_id"');
    expect(joined).toContain('"academic_periods"."college_id"');
    const scopes = state.joins.flatMap(p => p.params);
    expect(scopes.filter(p => p === collegeId).length).toBeGreaterThanOrEqual(3);
    expect(scopes).toContain(organizationId);
  });

  it("clamps stale deep links to the current final page after a Faculty assignment was removed", async () => {
    state.count = 2;
    state.rows = [item(1), item(2)];
    const result = await listAdminFacultyAssignments(principal(), {
      page: 1000,
      pageSize: 10,
    });
    expect(result.query.page).toBe(1);
    expect(result.totalPages).toBe(1);
    expect(result.items).toHaveLength(2);
    expect(state.offset).toBe(0);
    expect(state.pageSize).toBe(10);
  });

  it("does not invent a page or incorrectly fetch off-page data from an empty college", async () => {
    const result = await listAdminFacultyAssignments(principal(), { page: 999 });
    expect(result).toMatchObject({ total: 0, totalPages: 1, items: [] });
    expect(result.query.page).toBe(1);
    expect(state.offset).toBe(0);
  });

  it("prohibits disabled Super Admin, Mentor, Faculty and Learner before SQL construction", async () => {
    const base = principal();
    for (const altered of [
      { ...base, user: { ...base.user, platformStatus: "DISABLED" as const } },
      ...(["MENTOR", "FACULTY", "LEARNER"] as const).map(role => ({
        ...base,
        user: { ...base.user, systemRoles: [] },
        membership: {
          id: "membership",
          collegeId,
          organizationId,
          status: "ACTIVE" as const,
          roles: [role],
        },
      })),
      { ...base, adminScope: { collegeId: null, organizationId } },
    ]) {
      await expect(listAdminFacultyAssignments(altered, {}))
        .rejects.toThrow("Missing permission: courses.read");
    }
    expect(state.selects).toBe(0);
  });

  it("refuses caller-selected foreign tenant or invalid filters before database reads", async () => {
    for (const filters of [
      { collegeId: "other" },
      { status: "DELETE" },
      { pageSize: 1000 },
      { page: -1 },
      { sectionId: "not-uuid" },
    ]) await expect(listAdminFacultyAssignments(principal(), filters)).rejects.toThrow();
    expect(state.selects).toBe(0);
  });

  it("limits selectable class facets by both cohort-program department and term college", async () => {
    await expect(getSuperAdminFacultyAssignmentClasses(principal())).resolves.toEqual([]);
    const joined = state.joins.map(p => p.sql).join("\n");
    expect(joined).toContain('"academic_periods"."college_id"');
    expect(joined).toContain('"departments"."college_id"');
    expect(state.joins.flatMap(p => p.params).filter(p => p === collegeId).length).toBeGreaterThanOrEqual(3);
    expect(state.joins.flatMap(p => p.params)).toContain(organizationId);
    expect(joined).toContain('"colleges"."organization_id"');
  });
});
