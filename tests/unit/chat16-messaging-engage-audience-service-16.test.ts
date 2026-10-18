import { beforeEach, describe, expect, it, vi } from "vitest";
import { getDb } from "@/db/client";
import { requirePlacementManageScope } from "@/modules/placements/scope";
import { assertPersistedPlatformPermission } from "@/modules/permissions/persisted-actor";
import {
  previewEngageCampaignAudience, previewSelectedTpoCampaignAudience,
} from "@/modules/messaging/engage-audience-service";
import type { RequestContext } from "@/modules/identity/context";

vi.mock("@/db/client", () => ({ getDb: vi.fn() }));
vi.mock("@/modules/placements/scope", () => ({
  requirePlacementManageScope: vi.fn(),
}));
vi.mock("@/modules/permissions/persisted-actor", () => ({
  assertPersistedPlatformPermission: vi.fn(),
}));

const collegeId = "11111111-1111-4111-8111-111111111111";
const orgId = "22222222-2222-4222-8222-222222222222";
const leadA = "33333333-3333-4333-8333-333333333333";
const leadB = "44444444-4444-4444-8444-444444444444";
const tpo: RequestContext = {
  user: { id: "user-a", identityUid: "tpo-a",
    platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: "tpo-m-a", collegeId, organizationId: orgId,
    status: "ACTIVE", roles: ["TPO"] },
};

function fakeDb(rows: readonly Record<string, unknown>[]) {
  const where = vi.fn(async () => rows);
  const from = vi.fn(() => ({ where }));
  const select = vi.fn(() => ({ from }));
  const tx = { select };
  const transaction = vi.fn(async (cb: (value: typeof tx) => Promise<unknown>) => cb(tx));
  vi.mocked(getDb).mockReturnValue({
    transaction,
  } as unknown as ReturnType<typeof getDb>);
  return { tx, select, from, where, transaction };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requirePlacementManageScope).mockResolvedValue({
    id: collegeId, organizationId: orgId,
  } as Awaited<ReturnType<typeof requirePlacementManageScope>>);
  vi.mocked(assertPersistedPlatformPermission).mockResolvedValue(undefined);
});

describe("chat-16 recruiter campaign audience preview service authorization", () => {
  it("MESSAGING-ENGAGE-SCOPE-16 denies wrong role, missing membership and invalid segments before opening DB", async () => {
    await expect(previewEngageCampaignAudience({
      ...tpo, membership: null,
    }, {})).rejects.toThrow();
    await expect(previewEngageCampaignAudience({
      ...tpo, membership: { ...tpo.membership!, roles: ["LEARNER"] },
    }, {})).rejects.toThrow();
    await expect(previewEngageCampaignAudience(tpo, {
      segment: "FORGED", collegeId: "other",
    })).rejects.toThrow();
    expect(getDb).not.toHaveBeenCalled();
  });

  it("MESSAGING-ENGAGE-COUNT-16 only emits bounded aggregate counts and verifies persisted scope", async () => {
    const db = fakeDb([{
      total: "9", eligible: "3", withoutEmail: "2",
      unsubscribed: "1", bounced: "1", notNow: "1", outsideSegment: "1",
    }]);
    const result = await previewEngageCampaignAudience(tpo, { segment: "NEW" });
    expect(result).toEqual({
      total: 9, eligible: 3, withoutEmail: 2,
      unsubscribed: 1, bounced: 1, notNow: 1, outsideSegment: 1,
    });
    expect(db.select).toHaveBeenCalledOnce();
    expect(assertPersistedPlatformPermission).toHaveBeenCalledWith(
      db.tx, tpo, "placements.manage", { collegeId, organizationId: orgId },
    );
    expect(JSON.stringify(result)).not.toContain("email");
  });

  it("MESSAGING-SELECTED-VALIDATE-16 rejects forged, duplicate or empty lead selections before DB", async () => {
    for (const raw of [
      { selectedLeadIds: [] }, { selectedLeadIds: ["not-a-uuid"] },
      { selectedLeadIds: [leadA, leadA] },
      { selectedLeadIds: [leadA], collegeId: orgId },
    ]) await expect(previewSelectedTpoCampaignAudience(tpo, raw)).rejects.toThrow();
    expect(getDb).not.toHaveBeenCalled();
    expect(requirePlacementManageScope).not.toHaveBeenCalled();
  });

  it("MESSAGING-SELECTED-SCOPE-16 fails closed for wrong role and revoked tenant", async () => {
    await expect(previewSelectedTpoCampaignAudience({
      ...tpo, membership: null,
    }, { selectedLeadIds: [leadA] })).rejects.toThrow();
    vi.mocked(requirePlacementManageScope).mockRejectedValue(new Error("scope revoked"));
    await expect(previewSelectedTpoCampaignAudience(
      tpo, { selectedLeadIds: [leadA] },
    )).rejects.toThrow("scope revoked");
    expect(getDb).not.toHaveBeenCalled();
  });

  it("MESSAGING-SELECTED-COUNT-16 never discloses recipients and counts unavailable selections", async () => {
    const db = fakeDb([{
      id: leadA, emailNorm: "recruiter@example.org",
      manualStage: "NEW", ownerMembershipId: null,
      unsubscribedAt: null, inviteBouncedAt: null,
    }]);
    const result = await previewSelectedTpoCampaignAudience(tpo, {
      selectedLeadIds: [leadA, leadB],
    });
    expect(result).toEqual({
      selected: 2, eligible: 1, leftOut: 1, unavailable: 1,
      suppressed: {
        NO_EMAIL: 0, UNSUBSCRIBED: 0, BOUNCED: 0, NOT_NOW: 0, DUPLICATE: 0,
      },
    });
    expect(JSON.stringify(result)).not.toContain("recruiter@example.org");
    expect(db.select).toHaveBeenCalledOnce();
    expect(assertPersistedPlatformPermission).toHaveBeenCalledWith(
      db.tx, tpo, "placements.manage", { collegeId, organizationId: orgId },
    );
  });
});
