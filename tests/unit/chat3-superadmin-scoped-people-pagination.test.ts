import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RequestContext } from "@/modules/identity/context";
import { PgDialect } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";

vi.mock("server-only", () => ({}));

const state = vi.hoisted(() => ({
  total: 0,
  rows: [] as Array<Record<string, unknown>>,
  queries: 0,
  countQueries: 0,
  offset: -1,
  pageSize: -1,
  classProjection: null as { sql: string; params: unknown[] } | null,
}));

vi.mock("@/db/client", () => ({
  getDb: () => ({
    select: (projection?: Record<string, unknown>) => {
      state.queries++;
      if (projection && "joinedAt" in projection) {
        const classExpression = projection.className as SQL.Aliased;
        const compiled = new PgDialect().sqlToQuery(classExpression.sql);
        state.classProjection = { sql: compiled.sql, params: compiled.params };
        const fields = projection;
        class TableQuery {
          innerJoin() { return this; }
          leftJoin() { return this; }
          where() { return this; }
          as() { return { id: fields.id, name: fields.name }; }
        }
        return { from: () => new TableQuery() };
      }
      if (projection && "total" in projection) {
        return {
          from: async () => {
            state.countQueries++;
            return [{ total: state.total }];
          },
        };
      }
      return {
        from: () => ({
          orderBy: () => ({
            limit: (amount: number) => ({
              offset: async (value: number) => {
                state.offset = value;
                state.pageSize = amount;
                return state.rows.slice(value, value + amount);
              },
            }),
          }),
        }),
      };
    },
  }),
}));

import { listAdminScopedPeople } from "@/modules/admin-ui/super-admin-scoped-people-service";

const collegeId = "11111111-1111-4111-8111-111111111111";
const organizationId = "22222222-2222-4222-8222-222222222222";

function context(): RequestContext {
  return {
    user: {
      id: "33333333-3333-4333-8333-333333333333",
      identityUid: "super-admin",
      platformStatus: "ACTIVE",
      systemRoles: ["SUPER_ADMIN"],
    },
    membership: null,
    adminScope: { collegeId, organizationId },
  };
}

const sample = (index: number) => ({
  id: "person-" + index,
  status: "ACTIVE",
  joinedAt: new Date("2099-01-01T00:00:00.000Z"),
  name: "Faculty " + index,
  platformStatus: "ACTIVE",
  email: "person" + index + "@example.test",
  phone: null,
  collegeName: "Selected College",
  departmentName: null,
  employmentType: null,
  academicTitle: null,
  mentorRole: false,
  gender: null,
  rollNumber: null,
  className: null,
});

beforeEach(() => {
  state.total = 0;
  state.rows = [];
  state.queries = 0;
  state.countQueries = 0;
  state.offset = -1;
  state.pageSize = -1;
  state.classProjection = null;
});

describe("SA-people-scoped-01 selected-college membership pagination", () => {
  it("clamps a stale deep page to the last available page before selecting records", async () => {
    state.total = 2;
    state.rows = [sample(1), sample(2)];
    const result = await listAdminScopedPeople(context(), "FACULTY", {
      page: 999, pageSize: 10,
    });
    expect(result.query.page).toBe(1);
    expect(result.totalPages).toBe(1);
    expect(result.total).toBe(2);
    expect(result.items).toHaveLength(2);
    expect(result.items.map(row => row.title)).toEqual(["Faculty 1", "Faculty 2"]);
    expect(state.offset).toBe(0);
    expect(state.pageSize).toBe(10);
    expect(state.countQueries).toBe(1);
  });

  it("keeps a valid filtered page and limits the selected rows to the allowed page size", async () => {
    state.total = 28;
    state.rows = Array.from({ length: 28 }, (_, i) => sample(i + 1));
    const result = await listAdminScopedPeople(context(), "FACULTY", {
      page: 2, pageSize: 25,
    });
    expect(result.totalPages).toBe(2);
    expect(result.query.page).toBe(2);
    expect(result.items).toHaveLength(3);
    expect(result.items[0]?.title).toBe("Faculty 26");
    expect(state.offset).toBe(25);
    expect(state.pageSize).toBe(25);
  });

  it("represents an empty selected college as page 1 of 1, not an invalid offset", async () => {
    const result = await listAdminScopedPeople(context(), "FACULTY", {
      page: 1000,
    });
    expect(result).toMatchObject({ total: 0, totalPages: 1, items: [] });
    expect(result.query.page).toBe(1);
    expect(state.offset).toBe(0);
  });

  it("SA3-PEOPLE-CLASS-01 restricts projected learner class to the selected college, matching cohort and term", async () => {
    await listAdminScopedPeople(context(), "LEARNER", {});
    expect(state.classProjection).not.toBeNull();
    const sql = state.classProjection!.sql;
    expect(sql).toContain("class_department.college_id");
    expect(sql).toContain("s.cohort_id=e.cohort_id");
    expect(sql).toContain("s.academic_period_id=se.academic_period_id");
    expect(sql).toContain("class_program.id=e.program_id");
    expect(state.classProjection!.params).toContain(collegeId);
  });

  it("rejects Learner, Mentor, disabled administrator or missing selected college before any SQL", async () => {
    const active = context();
    const actors: RequestContext[] = [
      { ...active, user: { ...active.user, systemRoles: [] }, membership: {
        id: "mentor", organizationId, collegeId, status: "ACTIVE", roles: ["MENTOR"],
      } },
      { ...active, user: { ...active.user, systemRoles: [] }, membership: {
        id: "learner", organizationId, collegeId, status: "ACTIVE", roles: ["LEARNER"],
      } },
      { ...active, user: { ...active.user, platformStatus: "DISABLED" } },
      { ...active, adminScope: { collegeId: null, organizationId } },
    ];
    for (const actor of actors) {
      await expect(listAdminScopedPeople(actor, "FACULTY", {}))
        .rejects.toThrow("Missing permission: people.manage");
    }
    expect(state.queries).toBe(0);
  });

  it("rejects injected scope, duplicate query and invalid pagination before database lookup", async () => {
    for (const filters of [
      { collegeId: "foreign" }, { page: -1 }, { page: 1.5 },
      { pageSize: 999 }, { status: "UNKNOWN" }, { q: "x".repeat(101) },
    ]) {
      await expect(listAdminScopedPeople(context(), "FACULTY", filters))
        .rejects.toThrow();
    }
    expect(state.queries).toBe(0);
  });
});
