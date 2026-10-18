import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RequestContext } from "@/modules/identity/context";
import { rollbackProjectTemplate } from "@/modules/projects/template-rollback-service";

const templateId = "11111111-1111-4111-8111-111111111111";
const versionId = "22222222-2222-4222-8222-222222222222";

const state = vi.hoisted(() => ({
  currentVersion: 3,
  templateStatus: "PUBLISHED",
  persistedAllowed: true,
  persistedChecks: 0,
  selects: 0,
  updates: 0,
  inserts: 0,
  auditEvents: 0,
  simulateConflict: false,
}));

vi.mock("@/modules/permissions/persisted-actor", () => ({
  assertPersistedPlatformPermission: async () => {
    state.persistedChecks += 1;
    if (!state.persistedAllowed) throw new Error("Missing permission: project-template.manage");
  },
}));
vi.mock("@/modules/activity/service", () => ({
  recordActivityEventInTransaction: async () => {
    state.auditEvents += 1;
    return { id: "audit-event" };
  },
}));
vi.mock("@/db/client", () => ({
  getDb: () => ({
    transaction: async (run: (tx: unknown) => Promise<unknown>) => {
      let reads = 0;
      const tx = {
        select: () => {
          const step = reads++;
          state.selects += 1;
          const query = {
            from: () => query,
            where: () => query,
            for: () => query,
            limit: async () => step === 0 ? [{
              id: templateId,
              title: "Current",
              summary: "Current",
              status: state.templateStatus,
              currentVersion: state.currentVersion,
              publishedVersion: 2,
            }] : [{
              id: versionId,
              templateId,
              title: "Historical version",
              summary: "Prior snapshot",
              version: 1,
              blueprint: {
                overview: { goal: "Finish a project", deliverables: ["Demo"] },
                releases: [],
                sprints: [],
                tasks: [],
                resources: [],
              },
            }],
          };
          return query;
        },
        update: () => ({
          set: (values: { currentVersion: number; title: string; summary: string }) => ({
            where: () => ({
              returning: async () => {
                if (state.simulateConflict) return [];
                state.updates += 1;
                state.currentVersion = values.currentVersion;
                return [{ id: templateId, ...values, status: state.templateStatus }];
              },
            }),
          }),
        }),
        insert: () => ({
          values: (values: { version: number }) => ({
            returning: async () => {
              state.inserts += 1;
              return [{ id: "new-version", ...values }];
            },
          }),
        }),
      };
      return run(tx);
    },
  }),
}));

const actor = (): RequestContext => ({
  user: {
    id: "33333333-3333-4333-8333-333333333333",
    identityUid: "global-admin",
    platformStatus: "ACTIVE",
    systemRoles: ["SUPER_ADMIN"],
  },
  membership: null,
  adminScope: null,
});
const valid = () => ({ versionId, expectedTemplateVersion: 3, confirmed: true });

beforeEach(() => {
  state.currentVersion = 3;
  state.templateStatus = "PUBLISHED";
  state.persistedAllowed = true;
  state.persistedChecks = 0;
  state.selects = 0;
  state.updates = 0;
  state.inserts = 0;
  state.auditEvents = 0;
  state.simulateConflict = false;
});

describe("Super Admin Projects template rollback permission and version transitions", () => {
  it("PROJ-BREAK-idor-36 role revoked after page authentication fails inside transaction before new version", async () => {
    state.persistedAllowed = false;
    await expect(rollbackProjectTemplate(actor(), templateId, valid()))
      .rejects.toThrow("Missing permission: project-template.manage");
    expect(state.persistedChecks).toBe(1);
    expect(state.selects).toBe(1);
    expect(state.updates).toBe(0);
    expect(state.inserts).toBe(0);
    expect(state.auditEvents).toBe(0);
  });

  it("PROJ-BREAK-races-14 archived, stale and invalid requests never append history", async () => {
    state.templateStatus = "ARCHIVED";
    await expect(rollbackProjectTemplate(actor(), templateId, valid()))
      .rejects.toThrow("PROJECT_TEMPLATE_STALE_VERSION");
    state.templateStatus = "PUBLISHED";
    await expect(rollbackProjectTemplate(actor(), templateId, {
      ...valid(), expectedTemplateVersion: 2,
    })).rejects.toThrow("PROJECT_TEMPLATE_STALE_VERSION");
    await expect(rollbackProjectTemplate(actor(), templateId, {
      ...valid(), confirmed: false,
    })).rejects.toThrow();
    expect(state.updates).toBe(0);
    expect(state.inserts).toBe(0);
    expect(state.auditEvents).toBe(0);
  });

  it("PROJ-BREAK-races-15 valid snapshot becomes a new version once; stale retry cannot overwrite it", async () => {
    const first = await rollbackProjectTemplate(actor(), templateId, valid());
    expect(first.restoredFromVersion).toBe(1);
    expect(first.template.currentVersion).toBe(4);
    expect(first.impact.publishedVersion).toBe(2);
    expect(first.impact.existingWorkspaces).toBe("unchanged");
    expect(state.updates).toBe(1);
    expect(state.inserts).toBe(1);
    expect(state.auditEvents).toBe(1);
    await expect(rollbackProjectTemplate(actor(), templateId, valid()))
      .rejects.toThrow("PROJECT_TEMPLATE_STALE_VERSION");
    expect(state.inserts).toBe(1);
    expect(state.auditEvents).toBe(1);
  });

  it("PROJ-BREAK-idor-37 disabled Super Admin cannot enter the rollback transaction", async () => {
    const session = actor();
    await expect(rollbackProjectTemplate({
      ...session, user: { ...session.user, platformStatus: "DISABLED" },
    }, templateId, valid())).rejects.toThrow("Missing permission: project-template.manage");
    expect(state.selects).toBe(0);
  });
});
