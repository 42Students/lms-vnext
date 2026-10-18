import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import type { RequestContext } from "@/modules/identity/context";
import {
  getProjectAdminSubmissionSummary,
  listProjectAdminSubmissionQueue,
} from "@/modules/projects/admin-insights-service";

const collegeId = "11111111-1111-4111-8111-111111111111";
const otherCollegeId = "22222222-2222-4222-8222-222222222222";
const organizationId = "33333333-3333-4333-8333-333333333333";
const otherOrganizationId = "44444444-4444-4444-8444-444444444444";

const state = vi.hoisted(() => ({
  selected: [] as Record<string, unknown>[],
}));

type QueryChain = {
  from: () => QueryChain;
  innerJoin: () => QueryChain;
  leftJoin: () => QueryChain;
  where: () => QueryChain;
  orderBy: () => QueryChain;
  limit: () => QueryChain;
  offset: () => QueryChain;
  then: (
    fulfill: (rows: unknown[]) => unknown,
    reject?: (reason: unknown) => unknown,
  ) => Promise<unknown>;
};

vi.mock("@/modules/projects/scope", () => ({
  loadProjectCollegeScope: async (id: string) => ({
    id,
    organizationId: id === collegeId ? organizationId : otherOrganizationId,
  }),
}));

vi.mock("@/db/client", () => ({
  getDb: () => ({
    select: (columns: Record<string, unknown>) => {
      state.selected.push(columns);
      const chain: QueryChain = {
        from: () => chain,
        innerJoin: () => chain,
        leftJoin: () => chain,
        where: () => chain,
        orderBy: () => chain,
        limit: () => chain,
        offset: () => chain,
        then: (
          fulfill: (rows: unknown[]) => unknown,
          reject?: (reason: unknown) => unknown,
        ) => Promise.resolve("activeWorkspaces" in columns
          ? [{ activeWorkspaces: 4, pendingReview: 2, needsStudentAction: 1, reviewed: 1 }]
          : "value" in columns ? [{ value: 0 }] : []).then(fulfill, reject),
      };
      return chain;
    },
  }),
}));

const actor = (): RequestContext => ({
  user: {
    id: "55555555-5555-4555-8555-555555555555",
    identityUid: "super-admin",
    platformStatus: "ACTIVE",
    systemRoles: ["SUPER_ADMIN"],
  },
  membership: null,
  adminScope: { collegeId, organizationId },
});
const dialect = new PgDialect();
const render = (fragment: unknown) =>
  dialect.sqlToQuery(fragment as SQL).sql.replace(/\s+/g, " ").trim();

beforeEach(() => {
  state.selected = [];
});

describe("IIT Dharwad Projects: admin submission correlated SQL and tenancy", () => {
  it("PROJ-BREAK-reports-08 submission status counts bind to the outer project, not a submission ID", async () => {
    expect(await getProjectAdminSubmissionSummary(actor(), collegeId)).toEqual({
      activeWorkspaces: 4,
      pendingReview: 2,
      needsStudentAction: 1,
      reviewed: 1,
    });
    const selected = state.selected.find((fields) => "pendingReview" in fields);
    expect(selected).toBeDefined();
    for (const key of ["pendingReview", "needsStudentAction", "reviewed"]) {
      const sqlText = render(selected![key]);
      expect(sqlText).toContain('sub.project_id = "project_instances"."id"');
      expect(sqlText).not.toContain('sub.project_id = "id"');
    }
  });

  it("PROJ-BREAK-reports-10 completed and archived submissions do not inflate actionable review counters", async () => {
    await getProjectAdminSubmissionSummary(actor(), collegeId);
    const selected = state.selected.find((fields) => "pendingReview" in fields);
    expect(selected).toBeDefined();
    for (const key of ["pendingReview", "needsStudentAction"]) {
      const rendered = render(selected![key]);
      expect(rendered).toContain("filter (where ");
      expect(rendered).toContain("'ACTIVE'");
      expect(rendered).toContain('sub.project_id = "project_instances"."id"');
    }
    expect(render(selected!.reviewed)).not.toContain("'ACTIVE'");
  });

  it("PROJ-BREAK-reports-09 mentor lookups correlate to their own workspace and not the inner member ID", async () => {
    const result = await listProjectAdminSubmissionQueue(actor(), collegeId, {});
    expect(result.total).toBe(0);
    const selected = state.selected.find((fields) => "mentorMembershipId" in fields);
    expect(selected).toBeDefined();
    const sqlText = render(selected!.mentorMembershipId);
    expect(sqlText).toContain('pm.project_id="project_instances"."id"');
    expect(sqlText).not.toContain('pm.project_id="id"');
    expect(sqlText).toContain("pm.ended_at is null");
  });

  it("PROJ-BREAK-idor-23 selected Super Admin college cannot read another organization's summary or queue", async () => {
    await expect(getProjectAdminSubmissionSummary(actor(), otherCollegeId))
      .rejects.toThrow("Missing permission: projects.manage");
    await expect(listProjectAdminSubmissionQueue(actor(), otherCollegeId))
      .rejects.toThrow("Missing permission: projects.manage");
    expect(state.selected).toHaveLength(0);
  });
});
