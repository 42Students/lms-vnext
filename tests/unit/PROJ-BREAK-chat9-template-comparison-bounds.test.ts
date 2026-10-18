import { beforeEach, describe, expect, it, vi } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";
import type { RequestContext } from "@/modules/identity/context";
import { getSuperAdminTemplateVersionComparison } from "@/modules/projects/template-version-comparison-service";

const templateId = "11111111-1111-4111-8111-111111111111";
const versionId = "22222222-2222-4222-8222-222222222222";
const currentId = "33333333-3333-4333-8333-333333333333";
const state = vi.hoisted(() => ({
  readCount: 0, limits: [] as number[], predicates: [] as SQL[],
  templateRows: [] as Record<string, unknown>[],
  versionRows: [] as Record<string, unknown>[],
}));
vi.mock("@/db/client", () => ({
  getDb: () => ({
    select: () => {
      const step = state.readCount++;
      const query = {
        from: () => query,
        where: (predicate: SQL) => { state.predicates.push(predicate); return query; },
        limit: (size: number) => {
          state.limits.push(size);
          return Promise.resolve(step === 0 ? state.templateRows : state.versionRows);
        },
      };
      return query;
    },
  }),
}));
const actor = (): RequestContext => ({
  user: { id: "44444444-4444-4444-8444-444444444444",
    identityUid: "super-admin", platformStatus: "ACTIVE", systemRoles: ["SUPER_ADMIN"] },
  membership: null, adminScope: null,
});
beforeEach(() => {
  state.readCount = 0; state.limits = []; state.predicates = [];
  state.templateRows = [{ id: templateId, title: "Project", currentVersion: 4, status: "PUBLISHED" }];
  state.versionRows = [
    { id: versionId, templateId, title: "Past", summary: null, version: 2, blueprint: { tasks: [{}] } },
    { id: currentId, templateId, title: "Present", summary: null, version: 4, blueprint: { tasks: [{}, {}] } },
  ];
});
describe("Super Admin Projects: bounded history comparison and IDOR", () => {
  it("PROJ-BREAK-scale-24 fetches at most selected and current snapshots, with no assignment or history sweep", async () => {
    const result = await getSuperAdminTemplateVersionComparison(actor(), { templateId, versionId });
    expect(result.selected.id).toBe(versionId);
    expect(result.current.id).toBe(currentId);
    expect(result.changes.some(change => change.label === "tasks")).toBe(true);
    expect(state.readCount).toBe(2);
    expect(state.limits).toEqual([1, 2]);
    const sql = new PgDialect().sqlToQuery(state.predicates[1]);
    expect(sql.params).toContain(templateId);
    expect(sql.params).toContain(versionId);
    expect(sql.params).toContain(4);
    expect(sql.sql).toContain('"project_template_versions"."template_id"');
  });
  it("PROJ-BREAK-idor-18 refuses unauthorized requests before any database read", async () => {
    const user = actor();
    for (const ctx of [
      { ...user, user: { ...user.user, systemRoles: [] } },
      { ...user, user: { ...user.user, platformStatus: "DISABLED" as const } },
    ]) {
      await expect(getSuperAdminTemplateVersionComparison(ctx, { templateId, versionId }))
        .rejects.toThrow("Missing permission: project-template.read");
    }
    expect(state.readCount).toBe(0);
  });
  it("PROJ-BREAK-idor-19 does not disclose a non-selected, missing or wrong-template version", async () => {
    state.versionRows = [state.versionRows[1]];
    await expect(getSuperAdminTemplateVersionComparison(actor(), { templateId, versionId }))
      .rejects.toThrow("PROJECT_TEMPLATE_VERSION_NOT_FOUND");
    state.readCount = 0;
    state.templateRows = [];
    await expect(getSuperAdminTemplateVersionComparison(actor(), { templateId, versionId }))
      .rejects.toThrow("PROJECT_TEMPLATE_NOT_FOUND");
    state.readCount = 0;
    await expect(getSuperAdminTemplateVersionComparison(actor(), { templateId: "invalid", versionId }))
      .rejects.toThrow();
    expect(state.readCount).toBe(0);
  });
});
