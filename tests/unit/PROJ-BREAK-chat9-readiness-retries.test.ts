import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RequestContext } from "@/modules/identity/context";
import {
  isDuplicateProjectReadinessOverride,
} from "@/modules/projects/readiness-override-model";
import { overrideProjectReadiness } from "@/modules/projects/readiness-override-service";

const projectId = "11111111-1111-4111-8111-111111111111";
const collegeId = "22222222-2222-4222-8222-222222222222";
const organizationId = "33333333-3333-4333-8333-333333333333";
const state = vi.hoisted(() => ({
  status: "ACTIVE",
  current: null as null | { state: string; note: string | null },
  events: 0,
  checks: 0,
  persistedAllowed: true,
}));

vi.mock("@/modules/projects/access", () => ({
  requireProjectManageAccess: async () => ({
    project: { id: projectId }, collegeId, organizationId,
  }),
}));
vi.mock("@/modules/module-access/service", () => ({
  resolveOptionalModuleAccess: async () => ({ projects: { enabled: true } }),
}));
vi.mock("@/modules/permissions/persisted-actor", () => ({
  assertPersistedPlatformPermission: async () => {
    state.checks += 1;
    if (!state.persistedAllowed) throw new Error("Missing permission: projects.manage");
  },
}));
vi.mock("@/modules/activity/service", () => ({
  recordActivityEventInTransaction: async (_tx: unknown, _ctx: unknown, input: {
    metadata: { state: string; note?: string };
  }) => {
    state.events += 1;
    state.current = {
      state: input.metadata.state,
      note: input.metadata.note ?? null,
    };
    return { id: "audit-id" };
  },
}));
vi.mock("@/db/client", () => ({
  getDb: () => ({
    transaction: async (fn: (tx: unknown) => Promise<unknown>) => {
      let reads = 0;
      const tx = {
        select: () => {
          const kind = reads++;
          const chain = {
            from: () => chain,
            where: () => chain,
            leftJoin: () => chain,
            orderBy: () => chain,
            for: () => chain,
            limit: async () => kind === 0
              ? [{ id: projectId, title: "IIT Dharwad", status: state.status }]
              : state.current
                ? [{ metadata: state.current, occurredAt: new Date(), overriddenBy: "Admin" }]
                : [],
          };
          return chain;
        },
      };
      return fn(tx);
    },
  }),
}));

const actor: RequestContext = {
  user: {
    id: "44444444-4444-4444-8444-444444444444",
    identityUid: "super-admin",
    platformStatus: "ACTIVE",
    systemRoles: ["SUPER_ADMIN"],
  },
  membership: null,
  adminScope: { collegeId, organizationId },
};

beforeEach(() => {
  state.status = "ACTIVE";
  state.current = null;
  state.events = 0;
  state.checks = 0;
  state.persistedAllowed = true;
});

describe("IIT Dharwad Projects: readiness override replay and permission", () => {
  it("PROJ-BREAK-races-12 duplicate browser submit leaves one event while changed intent creates new history", async () => {
    const input = { state: "FORCE_UNLOCK", note: "Approved by chair" } as const;
    expect(await overrideProjectReadiness(actor, projectId, input)).toEqual(input);
    expect(state.events).toBe(1);
    expect(await overrideProjectReadiness(actor, projectId, input)).toEqual(input);
    expect(state.events).toBe(1);
    expect(await overrideProjectReadiness(actor, projectId, {
      ...input, note: "Approved after verification",
    })).toMatchObject({ state: "FORCE_UNLOCK", note: "Approved after verification" });
    expect(state.events).toBe(2);
    expect(await overrideProjectReadiness(actor, projectId, { state: "FORCE_BLOCK", note: "Policy" }))
      .toMatchObject({ state: "FORCE_BLOCK", note: "Policy" });
    expect(state.events).toBe(3);
    expect(state.checks).toBe(4);
  });

  it("PROJ-BREAK-races-13 clearing absent override is inert, clearing forced override writes exactly once", async () => {
    await overrideProjectReadiness(actor, projectId, { state: "CLEAR" });
    expect(state.events).toBe(0);
    await overrideProjectReadiness(actor, projectId, { state: "FORCE_BLOCK", note: "Policy" });
    expect(state.events).toBe(1);
    await overrideProjectReadiness(actor, projectId, { state: "CLEAR" });
    await overrideProjectReadiness(actor, projectId, { state: "CLEAR" });
    expect(state.events).toBe(2);
    expect(state.current).toEqual({ state: "CLEAR", note: null });
  });

  it("PROJ-BREAK-idor-29 stale Super Admin grant is denied after obtaining project row lock", async () => {
    state.persistedAllowed = false;
    await expect(overrideProjectReadiness(actor, projectId, {
      state: "FORCE_UNLOCK", note: "Malicious stale tab",
    })).rejects.toThrow("Missing permission: projects.manage");
    expect(state.checks).toBe(1);
    expect(state.events).toBe(0);
  });

  it("PROJ-BREAK-state-22 archived projects refuse overrides and nonidentical notes are not retries", async () => {
    state.status = "ARCHIVED";
    await expect(overrideProjectReadiness(actor, projectId, {
      state: "FORCE_BLOCK", note: "Not allowed",
    })).rejects.toThrow("PROJECT_INVALID_STATE");
    expect(state.events).toBe(0);
    expect(isDuplicateProjectReadinessOverride(
      { state: "FORCE_BLOCK", note: "A" },
      { state: "FORCE_BLOCK", note: "B" },
    )).toBe(false);
    expect(isDuplicateProjectReadinessOverride(
      { state: null, note: null },
      { state: "CLEAR" },
    )).toBe(true);
  });
});
