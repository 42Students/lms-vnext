import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getDb } from "@/db/client";
import { getTpoMessagingBatch } from "@/modules/messaging/receipt-detail-service";
import { tpoCampaignDraftStorageReady } from "@/modules/messaging/tpo-campaign-draft-service";
import { requirePlacementManageScope } from "@/modules/placements/scope";
import { assertPersistedPlatformPermission } from "@/modules/permissions/persisted-actor";
import type { RequestContext } from "@/modules/identity/context";

vi.mock("@/db/client", () => ({ getDb: vi.fn() }));
vi.mock("@/modules/placements/scope", () => ({
  requirePlacementManageScope: vi.fn(),
}));
vi.mock("@/modules/permissions/persisted-actor", () => ({
  assertPersistedPlatformPermission: vi.fn(),
}));

const batchId = "11111111-1111-4111-8111-111111111111";
const collegeId = "22222222-2222-4222-8222-222222222222";
const organizationId = "33333333-3333-4333-8333-333333333333";
const context: RequestContext = {
  user: { id: "user-a", identityUid: "identity-a", platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: "membership-a", collegeId, organizationId,
    status: "ACTIVE", roles: ["TPO"] },
};
const batch = {
  id: batchId, purpose: "Recruiter campaign", total: 4, queued: 1,
  sent: 1, failed: 1, suppressed: 1,
  createdAt: new Date("2026-10-18T00:00:00Z"), finalizedAt: null,
};
const receiptTotals = {
  receipts: 4, queued: 1, sent: 1, failed: 1, suppressed: 1,
};

function scopedDb(batchValue: typeof batch | null = batch) {
  let selects = 0;
  const tx = {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => {
          selects += 1;
          if (selects === 1) {
            return { limit: vi.fn(async () => batchValue ? [batchValue] : []) };
          }
          return Promise.resolve([receiptTotals]);
        }),
      })),
    })),
  };
  const transaction = vi.fn(async (fn: (value: typeof tx) => Promise<unknown>) => fn(tx));
  vi.mocked(getDb).mockReturnValue({
    transaction,
  } as unknown as ReturnType<typeof getDb>);
  return { tx, transaction };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requirePlacementManageScope).mockResolvedValue({
    id: collegeId, organizationId,
  } as Awaited<ReturnType<typeof requirePlacementManageScope>>);
  vi.mocked(assertPersistedPlatformPermission).mockResolvedValue(undefined);
});
afterEach(() => vi.unstubAllEnvs());

describe("chat-16 TPO receipt detail and campaign draft readiness services", () => {
  it("MESSAGING-DETAIL-16 denies wrong roles and malformed batch identifiers before any query", async () => {
    await expect(getTpoMessagingBatch(context, "../admin")).rejects.toThrow();
    await expect(getTpoMessagingBatch({
      ...context, membership: { ...context.membership!, roles: ["LEARNER"] },
    }, batchId)).rejects.toThrow();
    await expect(getTpoMessagingBatch({
      ...context, membership: null,
    }, batchId)).rejects.toThrow();
    expect(getDb).not.toHaveBeenCalled();
    expect(requirePlacementManageScope).not.toHaveBeenCalled();
  });

  it("MESSAGING-DETAIL-17 rejects an unauthorized college before opening the transaction", async () => {
    vi.mocked(requirePlacementManageScope).mockRejectedValue(new Error("DENIED"));
    await expect(getTpoMessagingBatch(context, batchId)).rejects.toThrow("DENIED");
    expect(requirePlacementManageScope).toHaveBeenCalledWith(context, collegeId);
    expect(getDb).not.toHaveBeenCalled();
  });

  it("MESSAGING-DETAIL-18 returns only aggregate receipts for a scoped batch", async () => {
    const db = scopedDb();
    const result = await getTpoMessagingBatch(context, batchId);
    expect(result).toMatchObject({
      ...batch, actualReceipts: 4, actualQueued: 1, actualSent: 1,
      actualFailed: 1, actualSuppressed: 1,
    });
    expect(result).not.toHaveProperty("recipientKey");
    expect(result).not.toHaveProperty("email");
    expect(db.tx.select).toHaveBeenCalledTimes(2);
    expect(assertPersistedPlatformPermission).toHaveBeenCalledWith(
      db.tx, context, "placements.manage", { organizationId, collegeId },
    );
  });

  it("MESSAGING-DETAIL-19 never reveals another college's absent batch", async () => {
    const db = scopedDb(null);
    await expect(getTpoMessagingBatch(context, batchId)).resolves.toBeNull();
    expect(db.tx.select).toHaveBeenCalledTimes(1);
  });

  it("MESSAGING-DRAFT-READY-16 fails closed without DB deployment readiness or on outage", async () => {
    const execute = vi.fn();
    vi.mocked(getDb).mockReturnValue({ execute } as unknown as ReturnType<typeof getDb>);
    vi.stubEnv("DB09_TPO_API_READY", "");
    await expect(tpoCampaignDraftStorageReady()).resolves.toBe(false);
    expect(execute).not.toHaveBeenCalled();
    vi.stubEnv("DB09_TPO_API_READY", "DB09_VERIFIED");
    execute.mockResolvedValueOnce({ rows: [{ ready: true }] })
      .mockResolvedValueOnce({ rows: [{ ready: false }] })
      .mockRejectedValueOnce(new Error("database unavailable"));
    await expect(tpoCampaignDraftStorageReady()).resolves.toBe(true);
    await expect(tpoCampaignDraftStorageReady()).resolves.toBe(false);
    await expect(tpoCampaignDraftStorageReady()).resolves.toBe(false);
    expect(execute).toHaveBeenCalledTimes(3);
  });
});
