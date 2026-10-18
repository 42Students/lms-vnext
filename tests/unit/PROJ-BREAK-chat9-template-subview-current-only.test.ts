import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RequestContext } from "@/modules/identity/context";
import { getSuperAdminTemplateSubview } from "@/modules/projects/template-subview-service";

const templateId = "11111111-1111-4111-8111-111111111111";
const state = vi.hoisted(() => ({
  selects: 0, limits: [] as number[], template: [] as Record<string, unknown>[],
  current: [] as Record<string, unknown>[],
}));
vi.mock("@/db/client", () => ({
  getDb: () => ({
    select: () => {
      const step = state.selects++;
      const query = {
        from: () => query,
        where: () => query,
        limit: (n: number) => {
          state.limits.push(n);
          return Promise.resolve(step === 0 ? state.template : state.current);
        },
        innerJoin: () => query,
        leftJoin: () => query,
        orderBy: () => query,
      };
      return query;
    },
  }),
}));
const actor = (): RequestContext => ({
  user: { id: "44444444-4444-4444-8444-444444444444", identityUid: "super-admin",
    platformStatus: "ACTIVE", systemRoles: ["SUPER_ADMIN"] },
  membership: null, adminScope: null,
});
beforeEach(() => {
  state.selects = 0; state.limits = [];
  state.template = [{id:templateId, title:"Template", currentVersion:10, status:"PUBLISHED"}];
  state.current = [{id:"22222222-2222-4222-8222-222222222222",templateId,
    title:"Current",summary:null,version:10,blueprint:{tasks:[{}]}}];
});
describe("Super Admin Project template tabs: bounded current-version reads", () => {
  it("PROJ-BREAK-scale-27 reads only the current snapshot for a non-history tab", async () => {
    const detail = await getSuperAdminTemplateSubview(actor(), templateId);
    expect(detail.template.id).toBe(templateId);
    expect(detail.currentVersion?.version).toBe(10);
    expect(detail.versions).toEqual([]);
    expect(detail.assignments).toEqual([]);
    expect(detail.assignedColleges).toEqual([]);
    expect(state.selects).toBe(2);
    expect(state.limits).toEqual([1, 1]);
  });
  it("PROJ-BREAK-idor-20 rejects unauthorized and forged template reads before selecting rows", async () => {
    const session = actor();
    for(const ctx of [
      {...session,user:{...session.user,systemRoles:[]}},
      {...session,user:{...session.user,platformStatus:"DISABLED" as const}},
    ]) {
      await expect(getSuperAdminTemplateSubview(ctx,templateId))
        .rejects.toThrow("Missing permission: project-template.read");
    }
    expect(state.selects).toBe(0);
    await expect(getSuperAdminTemplateSubview(actor(),"forged-id")).rejects.toThrow();
    expect(state.selects).toBe(0);
  });
  it("PROJ-BREAK-ux-18 distinguishes missing template from no historical versions", async () => {
    state.template = [];
    await expect(getSuperAdminTemplateSubview(actor(),templateId))
      .rejects.toThrow("PROJECT_TEMPLATE_NOT_FOUND");
    state.selects = 0;
    state.template = [{id:templateId,title:"Template",currentVersion:10,status:"PUBLISHED"}];
    state.current = [];
    const result = await getSuperAdminTemplateSubview(actor(),templateId);
    expect(result.currentVersion).toBeNull();
    expect(result.versions).toEqual([]);
  });
});
