import { beforeEach, describe, expect, it, vi } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";
import type { RequestContext } from "@/modules/identity/context";

vi.mock("server-only", () => ({}));
const state = vi.hoisted(() => ({
  membership: vi.fn(),
  permission: vi.fn(),
  transactions: 0,
  selects: 0,
  predicates: [] as Array<{ sql: string; params: unknown[] }>,
  events: [] as Array<{ id: string; summary: string; occurredAt: Date }>,
}));
vi.mock("@/modules/people/admin-membership-detail-service", () => ({
  getSuperAdminMembershipDetail: state.membership,
}));
vi.mock("@/modules/permissions/persisted-actor", () => ({
  assertPersistedPlatformPermission: state.permission,
}));
vi.mock("@/db/client", () => ({
  getDb: () => ({
    transaction: async (callback: (tx: unknown) => Promise<unknown>) => {
      state.transactions++;
      const tx = {
        select: () => {
          state.selects++;
          class Query {
            from() { return this; }
            where(condition: SQL) {
              const built = new PgDialect().sqlToQuery(condition);
              state.predicates.push({ sql: built.sql, params: built.params });
              return this;
            }
            orderBy() { return this; }
            async limit(_maximum: number) { return state.events; }
          }
          return new Query();
        },
      };
      return callback(tx);
    },
  }),
}));

import { listSuperAdminPersonAudit } from "@/modules/people/super-admin-person-audit-service";

const collegeId = "11111111-1111-4111-8111-111111111111";
const orgId = "22222222-2222-4222-8222-222222222222";
const membershipId = "33333333-3333-4333-8333-333333333333";
function context(): RequestContext {
  return {
    user: { id: "44444444-4444-4444-8444-444444444444",
      identityUid: "administrator", platformStatus: "ACTIVE", systemRoles: ["SUPER_ADMIN"] },
    membership: null,
    adminScope: { collegeId, organizationId: orgId },
  };
}
beforeEach(() => {
  vi.resetAllMocks();
  state.transactions = 0;
  state.selects = 0;
  state.predicates = [];
  state.events = [];
  state.membership.mockResolvedValue({
    id: membershipId, name: "Faculty One", collegeName: "College One",
  });
  state.permission.mockResolvedValue(undefined);
});

describe("SA3-PEOPLE-AUDIT-SERVICE-01 exact membership and tenant audit isolation", () => {
  it("requires a selected college and an existing scoped membership before opening a transaction", async () => {
    const actor = context();
    actor.adminScope = { collegeId: null, organizationId: orgId };
    expect(await listSuperAdminPersonAudit(actor, membershipId)).toBeNull();
    expect(state.membership).not.toHaveBeenCalled();
    expect(state.transactions).toBe(0);

    state.membership.mockResolvedValueOnce(null);
    expect(await listSuperAdminPersonAudit(context(), membershipId)).toBeNull();
    expect(state.transactions).toBe(0);
    expect(state.selects).toBe(0);
  });

  it("projects only exact-college actor or membership-subject events after persisted permission recheck", async () => {
    const event = {
      id: "55555555-5555-4555-8555-555555555555",
      occurredAt: new Date("2099-04-01T12:00:00Z"), summary: "Membership updated",
    };
    state.events = [event];
    const principal = context();
    expect(await listSuperAdminPersonAudit(principal, membershipId)).toEqual({
      membership: { id: membershipId, name: "Faculty One", collegeName: "College One" },
      events: [event],
    });
    expect(state.permission).toHaveBeenCalledOnce();
    expect(state.permission).toHaveBeenCalledWith(
      expect.anything(), principal, "people.manage",
      { collegeId, organizationId: orgId },
    );
    expect(state.transactions).toBe(1);
    expect(state.selects).toBe(1);
    const [predicate] = state.predicates;
    expect(predicate.sql).toContain('"activity_events"."college_id"');
    expect(predicate.sql).toContain('"activity_events"."actor_membership_id"');
    expect(predicate.sql).toContain('"activity_events"."subject_id"');
    expect(predicate.sql).toContain('"activity_events"."subject_type"');
    expect(predicate.params).toContain(collegeId);
    expect(predicate.params.filter(value => value === membershipId)).toHaveLength(2);
    expect(predicate.params).toContain("membership");
    expect(predicate.params).toContain("college_membership");
  });

  it("fails closed when a Super Admin loses persisted platform authority between profile and audit reads", async () => {
    state.permission.mockRejectedValueOnce(new Error("role was revoked"));
    await expect(listSuperAdminPersonAudit(context(), membershipId))
      .rejects.toThrow("role was revoked");
    expect(state.transactions).toBe(1);
    expect(state.selects).toBe(0);
    expect(state.predicates).toHaveLength(0);
  });

  it("propagates audit database outage rather than returning a misleading empty event history", async () => {
    state.membership.mockRejectedValueOnce(new Error("database unavailable"));
    await expect(listSuperAdminPersonAudit(context(), membershipId))
      .rejects.toThrow("database unavailable");
    expect(state.transactions).toBe(0);
  });
});
