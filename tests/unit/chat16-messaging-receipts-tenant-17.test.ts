import { beforeEach, describe, expect, it, vi } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";
import { getDb } from "@/db/client";
import { requirePlacementManageScope } from "@/modules/placements/scope";
import { assertPersistedPlatformPermission } from "@/modules/permissions/persisted-actor";
import {
  exportTpoMessagingHistory, listTpoMessagingHistory,
} from "@/modules/messaging/receipt-history-service";
import type { RequestContext } from "@/modules/identity/context";

vi.mock("@/db/client", () => ({ getDb: vi.fn() }));
vi.mock("@/modules/placements/scope", () => ({
  requirePlacementManageScope: vi.fn(),
}));
vi.mock("@/modules/permissions/persisted-actor", () => ({
  assertPersistedPlatformPermission: vi.fn(),
}));

const collegeId = "11111111-1111-4111-8111-111111111111";
const organizationId = "22222222-2222-4222-8222-222222222222";
const userId = "33333333-3333-4333-8333-333333333333";
const tpo: RequestContext = {
  user: { id: userId, identityUid: userId, platformStatus: "ACTIVE", systemRoles: [] },
  membership: {
    id: "44444444-4444-4444-8444-444444444444",
    collegeId, organizationId, status: "ACTIVE", roles: ["TPO"],
  },
};
const date = new Date("2026-10-18T00:00:00.000Z");
const receipt = (purpose: string) => ({
  id: collegeId, purpose, total: 1, queued: 0, sent: 1, failed: 0,
  suppressed: 0, createdAt: date, finalizedAt: date,
});
function fakeDb(responses: unknown[][]) {
  const predicates: unknown[] = [];
  const queriedLimits: number[] = [];
  const select = vi.fn(() => {
    const data = responses.shift() ?? [];
    const builder = {
      where: vi.fn(),
      orderBy: vi.fn(),
      limit: vi.fn((limit: number) => { queriedLimits.push(limit); return builder; }),
      offset: vi.fn(() => builder),
      then: (resolve: (rows: unknown) => unknown, reject?: (error: unknown) => unknown) =>
        Promise.resolve(data).then(resolve, reject),
    };
    builder.where.mockImplementation((predicate: unknown) => {
      predicates.push(predicate);
      return builder;
    });
    builder.orderBy.mockReturnValue(builder);
    return { from: vi.fn(() => builder) };
  });
  const tx = { select };
  const transaction = vi.fn(async (fn: (value: typeof tx) => Promise<unknown>) => fn(tx));
  vi.mocked(getDb).mockReturnValue({ transaction } as never);
  return { predicates, queriedLimits, select, transaction };
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(requirePlacementManageScope).mockResolvedValue({
    id: collegeId, organizationId,
  } as never);
});

describe("chat-16 TPO campaign receipt tenancy and full export behavior", () => {
  it("MSG-RECEIPT-ROLE-01 wrong role, deactivated principal or missing membership never reads receipts", async () => {
    for (const actor of [
      { ...tpo, membership: null },
      { ...tpo, membership: { ...tpo.membership!, roles: ["LEARNER" as const] } },
      { ...tpo, user: { ...tpo.user, platformStatus: "DISABLED" as const } },
    ]) {
      await expect(listTpoMessagingHistory(actor, {})).rejects.toThrow();
      await expect(exportTpoMessagingHistory(actor, {})).rejects.toThrow();
    }
    expect(requirePlacementManageScope).not.toHaveBeenCalled();
    expect(getDb).not.toHaveBeenCalled();
  });

  it("MSG-RECEIPT-TENANT-02 list filters both college and organization under a persisted TPO authorization", async () => {
    const db = fakeDb([[{ total: 1 }], [receipt("placement-update")]]);
    const page = await listTpoMessagingHistory(tpo, {
      purpose: "placement-update", page: 1,
    });
    expect(page.total).toBe(1);
    expect(page.rows[0]).toMatchObject({
      purpose: "placement-update", acceptedByProvider: 1, status: "FINALIZED",
    });
    expect(assertPersistedPlatformPermission).toHaveBeenCalledWith(
      expect.anything(), tpo, "placements.manage",
      { organizationId, collegeId },
    );
    expect(db.predicates).toHaveLength(2);
    for (const condition of db.predicates) {
      const q = new PgDialect().sqlToQuery(condition as never);
      expect(q.params).toContain(collegeId);
      expect(q.params).toContain(organizationId);
      expect(q.params).toContain("placement-update");
    }
    expect(db.queriedLimits).toContain(25);
  });

  it("MSG-RECEIPT-EXPORT-03 exports all bounded receipts, not just first page", async () => {
    const records = Array.from({ length: 51 }, (_, i) => receipt("campaign-" + i));
    const db = fakeDb([records]);
    const rows = await exportTpoMessagingHistory(tpo, {});
    expect(rows).toHaveLength(51);
    expect(db.queriedLimits).toContain(2001);
    expect(rows[0]).not.toHaveProperty("recipient");
    expect(rows[0]).not.toHaveProperty("providerToken");
  });

  it("MSG-RECEIPT-EXPORT-04 oversized export fails instead of silently losing rows", async () => {
    const db = fakeDb([Array.from({ length: 2001 }, (_, i) => receipt("campaign-" + i))]);
    await expect(exportTpoMessagingHistory(tpo, {}))
      .rejects.toThrow("CAMPAIGN_EXPORT_TOO_LARGE");
    expect(db.queriedLimits).toContain(2001);
  });
});
