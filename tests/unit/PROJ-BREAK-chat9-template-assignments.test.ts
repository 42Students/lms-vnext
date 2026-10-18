import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RequestContext } from "@/modules/identity/context";
import { assignProjectTemplateToCollege, revokeProjectTemplateFromCollege } from "@/modules/projects/template-service";

const templateId = "11111111-1111-4111-8111-111111111111";
const collegeId = "22222222-2222-4222-8222-222222222222";
const otherCollegeId = "33333333-3333-4333-8333-333333333333";
const organizationId = "44444444-4444-4444-8444-444444444444";
const otherOrganizationId = "55555555-5555-4555-8555-555555555555";
const versionOneId = "66666666-6666-4666-8666-666666666666";
const versionTwoId = "77777777-7777-4777-8777-777777777777";

type Assignment = {
  id: string;
  templateVersionId: string;
  assignedByUserId: string;
  assignedAt: Date;
  revokedAt?: Date | null;
};

const state = vi.hoisted(() => ({
  versionId: "66666666-6666-4666-8666-666666666666",
  templateStatus: "PUBLISHED",
  publishedVersion: 1 as number | null,
  assignment: null as Assignment | null,
  selectCalls: 0,
  transactions: 0,
  inserts: 0,
  updates: 0,
  events: 0,
  lockCalls: 0,
  persistedChecks: 0,
  persistedAllowed: true,
  revocationMode: "active" as "active" | "already" | "never",
}));

vi.mock("@/modules/projects/scope", () => ({
  loadProjectCollegeScope: async (id: string) => ({
    id,
    organizationId: id === otherCollegeId ? otherOrganizationId : organizationId,
  }),
}));

vi.mock("@/modules/permissions/persisted-actor", () => ({
  assertPersistedPlatformPermission: async () => {
    state.persistedChecks += 1;
    if (!state.persistedAllowed) throw new Error("Missing permission: project-template.assign");
  },
}));

vi.mock("@/modules/activity/service", () => ({
  recordActivityEventInTransaction: async () => {
    state.events += 1;
    return { id: "audit-event" };
  },
}));

vi.mock("@/db/client", () => ({
  getDb: () => ({
    transaction: async (callback: (tx: unknown) => Promise<unknown>) => {
      state.transactions += 1;
      const tx = {
        select: () => {
          const step = state.selectCalls++ % 3;
          const rows = step === 0
            ? [{ id: templateId, title: "IIT Dharwad", status: state.templateStatus, publishedVersion: state.publishedVersion }]
            : step === 1
              ? state.revocationMode === "active" ? [{ id: state.versionId }] : state.assignment ? [state.assignment] : []
              : state.assignment ? [state.assignment] : [];
          return {
            from: () => ({
              where: () => ({
                for: () => {
                  state.lockCalls += 1;
                  return { limit: async () => rows };
                },
                limit: async () => rows,
                orderBy: () => ({ limit: async () => rows }),
              }),
            }),
          };
        },
        insert: () => ({
          values: (values: { templateVersionId: string; assignedByUserId: string }) => ({
            returning: async () => {
              state.inserts += 1;
              state.assignment = {
                id: "88888888-8888-4888-8888-888888888888",
                templateVersionId: values.templateVersionId,
                assignedByUserId: values.assignedByUserId,
                assignedAt: new Date("2026-10-18T09:00:00.000Z"),
              };
              return [state.assignment];
            },
          }),
        }),
        update: () => ({
          set: (values: { templateVersionId: string; assignedByUserId: string; assignedAt: Date }) => ({
            where: () => ({
              returning: async () => {
                if ("revokedAt" in values && state.revocationMode !== "active") return [];
                state.updates += 1;
                state.assignment = { ...state.assignment!, ...values };
                return [state.assignment];
              },
            }),
          }),
        }),
      };
      return callback(tx);
    },
  }),
}));

const superAdmin = (): RequestContext => ({
  user: {
    id: "99999999-9999-4999-8999-999999999999",
    identityUid: "super-admin",
    platformStatus: "ACTIVE",
    systemRoles: ["SUPER_ADMIN"],
  },
  membership: null,
  adminScope: { collegeId, organizationId },
});

beforeEach(() => {
  state.versionId = versionOneId;
  state.templateStatus = "PUBLISHED";
  state.publishedVersion = 1;
  state.assignment = null;
  state.selectCalls = 0;
  state.transactions = 0;
  state.inserts = 0;
  state.updates = 0;
  state.events = 0;
  state.lockCalls = 0;
  state.persistedChecks = 0;
  state.persistedAllowed = true;
  state.revocationMode = "active";
});

describe("IIT Dharwad: Project template assignment retries and scope", () => {
  it("PROJ-BREAK-races-08 repeated identical assignment preserves actor/date and emits one activity", async () => {
    const actor = superAdmin();
    const first = await assignProjectTemplateToCollege(actor, templateId, collegeId);
    expect(first.templateVersionId).toBe(versionOneId);
    expect(state.inserts).toBe(1);
    expect(state.events).toBe(1);

    const assignedAt = first.assignedAt.getTime();
    const secondActor = { ...actor, user: { ...actor.user, id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" } };
    const second = await assignProjectTemplateToCollege(secondActor, templateId, collegeId);
    expect(second).toEqual(first);
    expect(second.assignedAt.getTime()).toBe(assignedAt);
    expect(second.assignedByUserId).toBe(actor.user.id);
    expect(state.inserts).toBe(1);
    expect(state.updates).toBe(0);
    expect(state.events).toBe(1);
    expect(state.transactions).toBe(2);
    expect(state.lockCalls).toBe(4);
  });

  it("PROJ-BREAK-races-09 publication of a new version refreshes once, repeated submission is inert", async () => {
    const actor = superAdmin();
    await assignProjectTemplateToCollege(actor, templateId, collegeId);
    state.versionId = versionTwoId;
    state.publishedVersion = 2;
    const revised = await assignProjectTemplateToCollege(actor, templateId, collegeId);
    expect(revised.templateVersionId).toBe(versionTwoId);
    expect(state.updates).toBe(1);
    expect(state.events).toBe(2);
    await assignProjectTemplateToCollege(actor, templateId, collegeId);
    expect(state.updates).toBe(1);
    expect(state.events).toBe(2);
  });

  it("PROJ-BREAK-idor-22 wrong tenant, wrong role and inactive Super Admin cannot assign", async () => {
    const actor = superAdmin();
    await expect(assignProjectTemplateToCollege(actor, templateId, otherCollegeId))
      .rejects.toThrow("Missing permission: project-template.assign");
    await expect(assignProjectTemplateToCollege({
      ...actor, user: { ...actor.user, platformStatus: "DISABLED" },
    }, templateId, collegeId)).rejects.toThrow("Missing permission: project-template.assign");
    await expect(assignProjectTemplateToCollege({
      ...actor, user: { ...actor.user, systemRoles: [] },
      membership: {
        id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        collegeId, organizationId, status: "ACTIVE", roles: ["COLLEGE_ADMIN"],
      },
    }, templateId, collegeId)).rejects.toThrow("Missing permission: project-template.assign");
    expect(state.transactions).toBe(0);
    expect(state.events).toBe(0);
  });

  it("PROJ-BREAK-idor-27 revocation after request authentication aborts before assignment or activity", async () => {
    state.persistedAllowed = false;
    await expect(assignProjectTemplateToCollege(superAdmin(), templateId, collegeId))
      .rejects.toThrow("Missing permission: project-template.assign");
    expect(state.persistedChecks).toBe(1);
    expect(state.inserts).toBe(0);
    expect(state.updates).toBe(0);
    expect(state.events).toBe(0);
  });

  it("PROJ-BREAK-idor-28 revoked system role stops college assignment removal after cached authentication", async () => {
    state.persistedAllowed = false;
    await expect(revokeProjectTemplateFromCollege(superAdmin(), templateId, collegeId))
      .rejects.toThrow("Missing permission: project-template.assign");
    expect(state.persistedChecks).toBe(1);
    expect(state.updates).toBe(0);
    expect(state.events).toBe(0);
  });

  it("PROJ-BREAK-races-10 repeated template revocation returns historical winner without duplicate activity", async () => {
    state.assignment = {
      id: "88888888-8888-4888-8888-888888888888",
      templateVersionId: versionOneId,
      assignedByUserId: superAdmin().user.id,
      assignedAt: new Date("2026-10-18T09:00:00.000Z"),
      revokedAt: null,
    };
    const first = await revokeProjectTemplateFromCollege(superAdmin(), templateId, collegeId);
    expect(first.revokedAt).not.toBeNull();
    expect(state.events).toBe(1);
    expect(state.updates).toBe(1);
    state.selectCalls = 0;
    state.revocationMode = "already";
    const retry = await revokeProjectTemplateFromCollege(superAdmin(), templateId, collegeId);
    expect(retry).toEqual(first);
    expect(state.events).toBe(1);
    expect(state.updates).toBe(1);
  });

  it("PROJ-BREAK-races-11 never-assigned college is not mistaken for an idempotent retry", async () => {
    state.revocationMode = "never";
    await expect(revokeProjectTemplateFromCollege(superAdmin(), templateId, collegeId))
      .rejects.toThrow("PROJECT_TEMPLATE_ASSIGNMENT_NOT_FOUND");
    expect(state.updates).toBe(0);
    expect(state.events).toBe(0);
  });

  it("PROJ-BREAK-state-21 archive, draft or unpublished template never writes an assignment", async () => {
    for (const status of ["ARCHIVED", "DRAFT", "UNKNOWN"]) {
      state.selectCalls = 0;
      state.templateStatus = status;
      await expect(assignProjectTemplateToCollege(superAdmin(), templateId, collegeId))
        .rejects.toThrow("PROJECT_TEMPLATE_NOT_PUBLISHED");
    }
    state.selectCalls = 0;
    state.templateStatus = "PUBLISHED";
    state.publishedVersion = null;
    await expect(assignProjectTemplateToCollege(superAdmin(), templateId, collegeId))
      .rejects.toThrow("PROJECT_TEMPLATE_NOT_PUBLISHED");
    expect(state.inserts).toBe(0);
    expect(state.updates).toBe(0);
    expect(state.events).toBe(0);
  });
});
