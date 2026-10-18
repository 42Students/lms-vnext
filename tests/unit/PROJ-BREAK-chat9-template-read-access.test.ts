import { beforeEach, describe, expect, it, vi } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";
import type { RequestContext } from "@/modules/identity/context";
import {
  getProjectTemplateDetail,
  listProjectTemplates,
} from "@/modules/projects/template-service";

const templateId = "11111111-1111-4111-8111-111111111111";
const collegeId = "22222222-2222-4222-8222-222222222222";
const organizationId = "33333333-3333-4333-8333-333333333333";

const state = vi.hoisted(() => ({
  selects: 0,
  mode: "detail" as "detail" | "list",
  assignmentPredicate: null as SQL | null,
  foundTemplate: true,
}));

vi.mock("@/db/client", () => ({
  getDb: () => ({
    select: (selection?: Record<string, unknown>) => {
      const step = state.selects++;
      const data = state.mode === "list"
        ? [{ id: templateId, title: "Template" }]
        : step === 0 ? state.foundTemplate
          ? [{ id: templateId, title: "Template", currentVersion: 2, status: "PUBLISHED" }]
          : []
        : selection?.assignment
          ? [{ assignment: { templateId, collegeId, revokedAt: null } }]
          : [
            { templateId, version: 2, blueprint: { tasks: [{}] } },
            { templateId, version: 1, blueprint: { tasks: [] } },
          ];
      const query = {
        from: () => query,
        innerJoin: () => query,
        where: (condition: SQL) => {
          if (selection?.assignment) state.assignmentPredicate = condition;
          return query;
        },
        orderBy: () => query,
        limit: (_: number) => query,
        then: (
          fulfill: (rows: unknown[]) => unknown,
          reject?: (error: unknown) => unknown,
        ) => Promise.resolve(data).then(fulfill, reject),
      };
      return query;
    },
  }),
}));

const actor = (): RequestContext => ({
  user: {
    id: "44444444-4444-4444-8444-444444444444",
    identityUid: "platform-admin",
    platformStatus: "ACTIVE",
    systemRoles: ["SUPER_ADMIN"],
  },
  membership: null,
  adminScope: { collegeId, organizationId },
});

beforeEach(() => {
  state.selects = 0;
  state.mode = "detail";
  state.assignmentPredicate = null;
  state.foundTemplate = true;
});

describe("IIT Dharwad Projects: template read rights and selected scope", () => {
  it("PROJ-BREAK-idor-43 a scoped Super Admin sees global template metadata but only selected-college assignments", async () => {
    const result = await getProjectTemplateDetail(actor(), templateId);
    expect(result.template.id).toBe(templateId);
    expect(result.currentVersion?.version).toBe(2);
    expect(result.versions.map(row => row.version)).toEqual([2, 1]);
    expect(result.assignments).toHaveLength(1);
    expect(state.selects).toBe(3);
    const where = new PgDialect().sqlToQuery(state.assignmentPredicate as SQL);
    expect(where.params).toContain(templateId);
    expect(where.params).toContain(collegeId);
    expect(where.params).toContain(organizationId);
  });

  it("PROJ-BREAK-idor-44 global template reads retain no selected-college assignment restriction", async () => {
    const context = { ...actor(), adminScope: null };
    await getProjectTemplateDetail(context, templateId);
    const where = new PgDialect().sqlToQuery(state.assignmentPredicate as SQL);
    expect(where.params).toContain(templateId);
    expect(where.params).not.toContain(collegeId);
    expect(where.params).not.toContain(organizationId);
  });

  it("PROJ-BREAK-idor-45 wrong role or deactivated actor cannot list or fetch templates", async () => {
    const admin = actor();
    for (const ctx of [
      { ...admin, user: { ...admin.user, platformStatus: "DISABLED" as const } },
      { ...admin, user: { ...admin.user, systemRoles: [] } },
    ]) {
      await expect(getProjectTemplateDetail(ctx, templateId)).rejects.toThrow("Missing permission: project-template.read");
      await expect(listProjectTemplates(ctx)).rejects.toThrow("Missing permission: project-template.read");
    }
    expect(state.selects).toBe(0);
  });

  it("PROJ-BREAK-ux-42 missing template returns a domain error rather than leaking another record", async () => {
    state.foundTemplate = false;
    await expect(getProjectTemplateDetail(actor(), templateId)).rejects.toThrow("PROJECT_TEMPLATE_NOT_FOUND");
  });

  it("PROJ-BREAK-idor-46 allowed Super Admin list reads require no selected-college relationship", async () => {
    state.mode = "list";
    const templates = await listProjectTemplates({ ...actor(), adminScope: null });
    expect(templates).toHaveLength(1);
    expect(templates[0]?.id).toBe(templateId);
  });
});
