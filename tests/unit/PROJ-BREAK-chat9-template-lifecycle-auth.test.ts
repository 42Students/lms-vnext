import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RequestContext } from "@/modules/identity/context";
import { archiveProjectTemplate, unpublishProjectTemplate } from "@/modules/projects/template-service";

const templateId = "11111111-1111-4111-8111-111111111111";
const state = vi.hoisted(() => ({
  status: "PUBLISHED",
  activeAssignments: false,
  persistedAllowed: true,
  checks: 0,
  updates: 0,
  events: 0,
  transactions: 0,
}));

vi.mock("@/modules/permissions/persisted-actor", () => ({
  assertPersistedPlatformPermission: async () => {
    state.checks += 1;
    if (!state.persistedAllowed) throw new Error("Missing permission: project-template.manage");
  },
}));
vi.mock("@/modules/activity/service", () => ({
  recordActivityEventInTransaction: async () => {
    state.events += 1;
    return { id: "record" };
  },
}));
vi.mock("@/db/client", () => ({
  getDb: () => ({
    transaction: async (callback: (tx: unknown) => Promise<unknown>) => {
      state.transactions += 1;
      let selects = 0;
      const tx = {
        select: () => {
          const step = selects++;
          const query = {
            from: () => query,
            where: () => query,
            for: () => query,
            limit: async () => step === 0 ? [{
              id: templateId,
              title: "IIT Dharwad Projects",
              status: state.status,
              publishedVersion: 2,
              currentVersion: 2,
            }] : state.activeAssignments ? [{ id: "assignment" }] : [],
          };
          return query;
        },
        update: () => ({
          set: (changes: { status: string; publishedVersion?: number | null }) => ({
            where: () => ({
              returning: async () => {
                state.updates += 1;
                state.status = changes.status;
                return [{ id: templateId, title: "IIT Dharwad Projects", ...changes }];
              },
            }),
          }),
        }),
      };
      return callback(tx);
    },
  }),
}));
const actor = (): RequestContext => ({
  user: {
    id: "22222222-2222-4222-8222-222222222222",
    identityUid: "super-admin",
    platformStatus: "ACTIVE",
    systemRoles: ["SUPER_ADMIN"],
  },
  membership: null,
  adminScope: null,
});
beforeEach(() => {
  state.status = "PUBLISHED";
  state.activeAssignments = false;
  state.persistedAllowed = true;
  state.checks = 0;
  state.updates = 0;
  state.events = 0;
  state.transactions = 0;
});

describe("IIT Dharwad global template lifecycle: stale role and retry safety", () => {
  it("PROJ-BREAK-idor-38 persisted role revocation blocks both unpublish and archive before writing", async () => {
    state.persistedAllowed = false;
    await expect(unpublishProjectTemplate(actor(), templateId))
      .rejects.toThrow("Missing permission: project-template.manage");
    await expect(archiveProjectTemplate(actor(), templateId))
      .rejects.toThrow("Missing permission: project-template.manage");
    expect(state.checks).toBe(2);
    expect(state.updates).toBe(0);
    expect(state.events).toBe(0);
  });

  it("PROJ-BREAK-races-16 duplicate unpublish never resets lifecycle or duplicates events", async () => {
    await unpublishProjectTemplate(actor(), templateId);
    expect(state.status).toBe("DRAFT");
    expect(state.events).toBe(1);
    const unchanged = await unpublishProjectTemplate(actor(), templateId);
    expect(unchanged.status).toBe("DRAFT");
    expect(state.updates).toBe(1);
    expect(state.events).toBe(1);
  });

  it("PROJ-BREAK-state-23 template with active college assignments cannot archive, successful retry emits one event", async () => {
    state.activeAssignments = true;
    await expect(archiveProjectTemplate(actor(), templateId))
      .rejects.toThrow("PROJECT_TEMPLATE_HAS_ACTIVE_ASSIGNMENTS");
    expect(state.updates).toBe(0);
    state.activeAssignments = false;
    const archived = await archiveProjectTemplate(actor(), templateId);
    expect(archived.status).toBe("ARCHIVED");
    expect(state.events).toBe(1);
    await archiveProjectTemplate(actor(), templateId);
    expect(state.events).toBe(1);
    expect(state.updates).toBe(1);
  });
});
