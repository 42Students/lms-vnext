import { beforeEach, describe, expect, it, vi } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";
import type { RequestContext } from "@/modules/identity/context";
import { listSuperAdminTemplateDirectory } from "@/modules/projects/super-admin-template-directory-service";

vi.mock("server-only", () => ({}));

const collegeId = "11111111-1111-4111-8111-111111111111";
const organizationId = "22222222-2222-4222-8222-222222222222";
const templateA = "33333333-3333-4333-8333-333333333333";
const templateB = "44444444-4444-4444-8444-444444444444";

const state = vi.hoisted(() => ({
  queries: 0,
  limit: 0,
  offset: 0,
  assignmentPredicate: null as SQL | null,
  items: [] as Record<string, unknown>[],
  totals: [] as Record<string, unknown>[],
  assignments: [] as Record<string, unknown>[],
  versions: [] as Record<string, unknown>[],
}));

vi.mock("@/db/client", () => ({
  getDb: () => ({
    select: (columns: Record<string, unknown>) => {
      state.queries += 1;
      const kind = "total" in columns ? "totals"
        : "activeAssignments" in columns ? "assignments"
        : "blueprint" in columns ? "versions" : "items";
      const query = {
        from: () => query,
        where: (predicate: SQL | undefined) => {
          if (kind === "assignments") state.assignmentPredicate = predicate ?? null;
          return query;
        },
        innerJoin: () => query,
        orderBy: () => query,
        groupBy: () => query,
        limit: (value: number) => { state.limit = value; return query; },
        offset: (value: number) => { state.offset = value; return query; },
        then: (
          fulfill: (value: Record<string, unknown>[]) => unknown,
          reject?: (error: unknown) => unknown,
        ) => Promise.resolve(state[kind]).then(fulfill, reject),
      };
      return query;
    },
  }),
}));

const superAdmin = (): RequestContext => ({
  user: {
    id: "55555555-5555-4555-8555-555555555555",
    identityUid: "platform-admin",
    platformStatus: "ACTIVE",
    systemRoles: ["SUPER_ADMIN"],
  },
  membership: null,
  adminScope: { collegeId, organizationId },
});

beforeEach(() => {
  state.queries = 0;
  state.limit = 0;
  state.offset = 0;
  state.assignmentPredicate = null;
  state.totals = [{ total: 2 }];
  state.items = [
    { id: templateA, title: "A", slug: "a", status: "PUBLISHED", summary: null, currentVersion: 2, publishedVersion: 1 },
    { id: templateB, title: "B", slug: "b", status: "DRAFT", summary: "Brief", currentVersion: 1, publishedVersion: null },
  ];
  state.assignments = [{ templateId: templateA, activeAssignments: 3 }];
  state.versions = [
    { templateId: templateA, version: 1, blueprint: { tasks: Array(10).fill({}) } },
    { templateId: templateA, version: 2, blueprint: { releases: [{}], sprints: [{}, {}], tasks: [{}], resources: [] } },
    { templateId: templateB, version: 1, blueprint: { tasks: [], sprints: [] } },
  ];
});

describe("IIT Dharwad: Super Admin template catalogue role and tenant behavior", () => {
  it("PROJ-BREAK-idor-40 selected college shows only scoped assignment totals and current-version sections", async () => {
    const result = await listSuperAdminTemplateDirectory(superAdmin(), {});
    expect(result.assignmentScope).toBe("COLLEGE");
    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toMatchObject({
      id: templateA, activeAssignments: 3,
      sectionCounts: { releases: 1, sprints: 2, tasks: 1, resources: 0 },
    });
    expect(result.items[1]).toMatchObject({
      id: templateB, activeAssignments: 0,
      sectionCounts: { tasks: 0, sprints: 0 },
    });
    expect(result.total).toBe(2);
    expect(result.totalPages).toBe(1);
    expect(state.queries).toBe(4);
    const predicate = new PgDialect().sqlToQuery(state.assignmentPredicate as SQL);
    expect(predicate.params).toContain(collegeId);
  });

  it("PROJ-BREAK-idor-41 organization-only scope restricts assignment count query to that organization", async () => {
    const actor = { ...superAdmin(), adminScope: { collegeId: null, organizationId } };
    const result = await listSuperAdminTemplateDirectory(actor, {});
    expect(result.assignmentScope).toBe("ORGANIZATION");
    const predicate = new PgDialect().sqlToQuery(state.assignmentPredicate as SQL);
    expect(predicate.params).toContain(organizationId);
    expect(predicate.params).not.toContain(collegeId);
  });

  it("PROJ-BREAK-scale-26 second page remains bounded, and empty results skip extra joins", async () => {
    state.totals = [{ total: 41 }];
    state.items = [];
    const result = await listSuperAdminTemplateDirectory(superAdmin(), { page: 2 });
    expect(result.items).toEqual([]);
    expect(result.totalPages).toBe(3);
    expect(state.limit).toBe(20);
    expect(state.offset).toBe(20);
    expect(state.queries).toBe(2);
  });

  it("PROJ-BREAK-idor-42 revoked, disabled, or college-only actors are denied before querying", async () => {
    const admin = superAdmin();
    for (const actor of [
      { ...admin, user: { ...admin.user, platformStatus: "DISABLED" as const } },
      { ...admin, user: { ...admin.user, systemRoles: [] } },
      { ...admin, membership: {
        id: "66666666-6666-4666-8666-666666666666",
        collegeId, organizationId, status: "ACTIVE" as const, roles: ["COLLEGE_ADMIN" as const],
      }, user: { ...admin.user, systemRoles: [] } },
    ]) {
      await expect(listSuperAdminTemplateDirectory(actor, {}))
        .rejects.toThrow("Missing permission: project-template.read");
    }
    expect(state.queries).toBe(0);
  });
});
