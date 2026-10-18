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
  filters: [] as unknown[],
}));
vi.mock("@/db/client", () => ({
  getDb: () => ({
    select: () => {
      const step = state.selects++;
      const rows = step === 0
        ? [{ id: templateId, currentVersion: 2, status: "PUBLISHED", title: "Project" }]
        : step === 1
          ? [{ id: "version", version: 2, templateId }]
          : [{ assignment: { id: "assignment", collegeId } }];
      const chain = {
        from: () => chain,
        innerJoin: () => chain,
        where: (condition: unknown) => {
          state.filters.push(condition);
          return chain;
        },
        orderBy: () => chain,
        limit: async () => rows,
        then: (resolve: (values: typeof rows) => unknown) => Promise.resolve(rows).then(resolve),
      };
      return chain;
    },
  }),
}));
const context = (scope: RequestContext["adminScope"] = null): RequestContext => ({
  user: {
    id: "44444444-4444-4444-8444-444444444444",
    identityUid: "admin", platformStatus: "ACTIVE", systemRoles: ["SUPER_ADMIN"],
  },
  membership: null,
  adminScope: scope,
});
const dialect = new PgDialect();
const rendered = (filter: unknown) => dialect.sqlToQuery(filter as SQL);

beforeEach(() => {
  state.selects = 0;
  state.filters = [];
});

describe("Super Admin Projects global template catalogue and assignment read boundaries", () => {
  it("PROJ-BREAK-idor-34 wrong role and deactivated Super Admin fail before any data read", async () => {
    const admin = context();
    const collegeAdmin: RequestContext = {
      ...admin,
      user: { ...admin.user, systemRoles: [] },
      membership: {
        id: "55555555-5555-4555-8555-555555555555",
        collegeId, organizationId, status: "ACTIVE", roles: ["COLLEGE_ADMIN"],
      },
    };
    await expect(listProjectTemplates(collegeAdmin))
      .rejects.toThrow("Missing permission: project-template.read");
    await expect(getProjectTemplateDetail(collegeAdmin, templateId))
      .rejects.toThrow("Missing permission: project-template.read");
    await expect(listProjectTemplates({
      ...admin, user: { ...admin.user, platformStatus: "DISABLED" },
    })).rejects.toThrow("Missing permission: project-template.read");
    expect(state.selects).toBe(0);
  });

  it("PROJ-BREAK-idor-35 active Super Admin can list global catalogue but scoped detail only discloses scoped assignments", async () => {
    const all = await listProjectTemplates(context());
    expect(all).toHaveLength(1);
    state.selects = 0;
    state.filters = [];
    const row = await getProjectTemplateDetail(context({ organizationId, collegeId: null }), templateId);
    expect(row.template.id).toBe(templateId);
    expect(row.currentVersion?.version).toBe(2);
    const filter = rendered(state.filters[state.filters.length - 1]);
    expect(filter.sql).toContain('"colleges"."organization_id"');
    expect(filter.params).toContain(organizationId);
    expect(filter.sql).toContain('"project_template_college_assignments"."revoked_at" is null');
    state.selects = 0;
    state.filters = [];
    await getProjectTemplateDetail(context({ collegeId, organizationId }), templateId);
    const single = rendered(state.filters[state.filters.length - 1]);
    expect(single.sql).toContain('"colleges"."id"');
    expect(single.params).toContain(collegeId);
  });

  it("PROJ-BREAK-input-34 invalid template identifier does not query the global catalogue", async () => {
    await expect(getProjectTemplateDetail(context(), "not-a-template-uuid"))
      .rejects.toThrow();
    expect(state.selects).toBe(0);
  });
});
