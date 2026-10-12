import { beforeEach, describe, expect, it, vi } from "vitest";
import { requireLearnerPlacementAccess } from "@/modules/placements/learner-participation-guard";
import type { RequestContext } from "@/modules/identity/context";

const state = vi.hoisted(() => ({
  accountStatus: "ACTIVE",
  membershipStatus: "ACTIVE",
  persistedUserId: "11111111-1111-4111-8111-111111111111",
  persistedCollegeId: "22222222-2222-4222-8222-222222222222",
  enrollmentRows: [{
    id: "33333333-3333-4333-8333-333333333333",
    cohortId: "44444444-4444-4444-8444-444444444444",
    programId: "55555555-5555-4555-8555-555555555555",
    departmentId: "66666666-6666-4666-8666-666666666666",
    collegeId: "22222222-2222-4222-8222-222222222222",
  }],
  sectionRows: [] as Array<{ id: string; cohortId: string; status: string }>,
  memberReads: 0,
  enrollmentReads: 0,
  sectionReads: 0,
  moduleReads: 0,
}));

vi.mock("@/db/client", () => ({
  getDb: () => ({
    select: (fields: Record<string, unknown>) => {
      const query = {
        from() { return query; },
        innerJoin() { return query; },
        where() { return query; },
        async limit() {
          if ("platformStatus" in fields) {
            state.memberReads++;
            return [{
              collegeId: state.persistedCollegeId,
              userId: state.persistedUserId,
              status: state.membershipStatus,
              platformStatus: state.accountStatus,
            }];
          }
          if ("programId" in fields) {
            state.enrollmentReads++;
            return state.enrollmentRows.slice(0, 2);
          }
          if ("status" in fields && "cohortId" in fields) {
            state.sectionReads++;
            return state.sectionRows.slice(0, 2);
          }
          throw new Error("Unexpected database query in placement access guard");
        },
      };
      return query;
    },
  }),
}));

vi.mock("@/modules/module-access/service", () => ({
  resolveOptionalModuleAccessForChain: async () => {
    state.moduleReads++;
    return { placements: { enabled: true } };
  },
}));
vi.mock("@/modules/placements/access-service", () => ({
  resolveLearnerPlacementParticipation: async () => ({ status: "ELIGIBLE" }),
}));

const context: RequestContext = {
  user: {
    id: "11111111-1111-4111-8111-111111111111",
    identityUid: "placement-learner-test",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: "77777777-7777-4777-8777-777777777777",
    collegeId: "22222222-2222-4222-8222-222222222222",
    organizationId: "88888888-8888-4888-8888-888888888888",
    status: "ACTIVE",
    roles: ["LEARNER"],
  },
};

beforeEach(() => {
  state.accountStatus = "ACTIVE";
  state.membershipStatus = "ACTIVE";
  state.persistedUserId = context.user.id;
  state.persistedCollegeId = context.membership!.collegeId;
  state.memberReads = 0;
  state.enrollmentReads = 0;
  state.sectionReads = 0;
  state.moduleReads = 0;
});

describe("DB08 persisted learner identity gate", () => {
  it("denies an account disabled after request-context authentication, before any placement queries", async () => {
    state.accountStatus = "DISABLED";
    await expect(requireLearnerPlacementAccess(context)).rejects.toThrow();
    expect(state.memberReads).toBe(1);
    expect(state.enrollmentReads).toBe(0);
    expect(state.moduleReads).toBe(0);
  });

  it("denies a persisted membership suspended after context creation", async () => {
    state.membershipStatus = "SUSPENDED";
    await expect(requireLearnerPlacementAccess(context)).rejects.toThrow();
    expect(state.memberReads).toBe(1);
    expect(state.enrollmentReads).toBe(0);
  });

  it("denies a membership silently reassigned to another persisted user", async () => {
    state.persistedUserId = "99999999-9999-4999-8999-999999999999";
    await expect(requireLearnerPlacementAccess(context)).rejects.toThrow();
    expect(state.enrollmentReads).toBe(0);
  });

  it("denies a membership silently moved to another college", async () => {
    state.persistedCollegeId = "99999999-9999-4999-8999-999999999999";
    await expect(requireLearnerPlacementAccess(context)).rejects.toThrow();
    expect(state.enrollmentReads).toBe(0);
  });

  it("preserves eligible active learners and reaches their module and participation gate", async () => {
    const resolved = await requireLearnerPlacementAccess(context);
    expect(resolved.id).toBe(context.membership!.id);
    expect(state.memberReads).toBe(1);
    expect(state.enrollmentReads).toBe(1);
    expect(state.moduleReads).toBe(1);
  });
});
