import { beforeEach, describe, expect, it, vi } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";

const mocks = vi.hoisted(() => ({
  execute: vi.fn(),
  outboundReady: vi.fn(),
  authorize: vi.fn(),
  complete: vi.fn(),
  claim: vi.fn(),
  open: vi.fn(),
  globalHash: vi.fn(),
  emailVerified: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/db/client", () => ({
  getDb: () => ({ execute: mocks.execute }),
}));
vi.mock("@/modules/operations/outbound-delivery-queue", () => ({
  outboundDispatchRuntimeEnabled: mocks.outboundReady,
  OutboundDispatchNotReadyError: class extends Error {},
  authorizeOutboundProviderSend: mocks.authorize,
  completeOutboundDispatch: mocks.complete,
  claimOutboundDispatchBatch: mocks.claim,
}));
vi.mock("@/modules/operations/outbound-delivery-envelope", () => ({
  openOutboundDelivery: mocks.open,
  deriveGlobalEmailSuppressionHashForAddress: mocks.globalHash,
}));
vi.mock("@/modules/operations/email-suppression-activation", () => ({
  requireVerifiedGlobalEmailSuppression: mocks.emailVerified,
}));

import {
  dispatchClaimedOutbound,
  dispatchDueOutboundBatch,
} from "@/modules/operations/outbound-dispatch-runner";

const claim = {
  messageId: "10000000-0000-4000-8000-000000000001",
  requestDigest: "a".repeat(64),
  fence: 1,
};
const row = {
  id: claim.messageId,
  organization_id: "20000000-0000-4000-8000-000000000001",
  college_id: "30000000-0000-4000-8000-000000000001",
  source_event_id: "40000000-0000-4000-8000-000000000001",
  channel: "EMAIL",
  template_key: "RECRUITER_INVITATION",
  recipient_hash: "b".repeat(64),
  idempotency_key: "c".repeat(64),
  request_digest: claim.requestDigest,
  key_id: "v1",
  nonce_base64: "AA==",
  ciphertext_base64: "AA==",
  tag_base64: "AA==",
  not_before: null,
  expires_at: null,
  attempts: 1,
};
const emailIntent = {
  organizationId: row.organization_id,
  collegeId: row.college_id,
  sourceEventId: row.source_event_id,
  channel: "EMAIL",
  templateKey: "RECRUITER_INVITATION",
  recipient: "recipient@example.test",
};

describe("DB-050/DB-067 trusted outbound runner gate", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.outboundReady.mockReturnValue(true);
    mocks.execute.mockResolvedValue({ rows: [row] });
    mocks.open.mockReturnValue(emailIntent);
    mocks.globalHash.mockReturnValue("d".repeat(64));
    mocks.emailVerified.mockResolvedValue({});
    mocks.authorize.mockResolvedValue(true);
    mocks.complete.mockResolvedValue(true);
    mocks.claim.mockResolvedValue([]);
  });

  it("never calls EMAIL provider if independent migration/sender gate fails", async () => {
    mocks.emailVerified.mockRejectedValue(new Error("GLOBAL_EMAIL_SUPPRESSION_NOT_VERIFIED"));
    const send = vi.fn();
    await expect(dispatchClaimedOutbound(claim, "worker-1", { send }))
      .resolves.toBe("RECONCILIATION_REQUIRED");
    expect(mocks.emailVerified).toHaveBeenCalledTimes(1);
    expect(mocks.authorize).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
    expect(mocks.complete).not.toHaveBeenCalled();
  });

  it("calls exact-fence guard before a verified EMAIL provider send", async () => {
    const send = vi.fn(async () => ({
      kind: "ACCEPTED" as const,
      providerMessageId: "provider:123",
    }));
    await expect(dispatchClaimedOutbound(claim, "worker-1", { send }))
      .resolves.toBe("PROVIDER_ACCEPTED");
    expect(mocks.emailVerified).toHaveBeenCalledTimes(1);
    expect(mocks.authorize).toHaveBeenCalledWith({
      messageId: claim.messageId, worker: "worker-1",
      fence: 1, globalEmailHash: "d".repeat(64),
    });
    expect(send).toHaveBeenCalledWith(emailIntent);
    expect(mocks.complete).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: "PROVIDER_ACCEPTED", providerMessageId: "provider:123" }),
    );
  });

  it("a denied pre-send check never calls transport, even with verified EMAIL", async () => {
    mocks.authorize.mockResolvedValue(false);
    const send = vi.fn();
    await expect(dispatchClaimedOutbound(claim, "worker-1", { send }))
      .resolves.toBe("NOT_AUTHORIZED");
    expect(mocks.emailVerified).toHaveBeenCalledTimes(1);
    expect(send).not.toHaveBeenCalled();
  });

  it.each(["SMS", "WHATSAPP"] as const)(
    "refuses %s until independently approved DLT/consent transport exists", async (channel) => {
      mocks.open.mockReturnValue({
        ...emailIntent, channel, recipient: "+919876543210",
      });
      const send = vi.fn();
      await expect(dispatchClaimedOutbound(claim, "worker-1", { send }))
        .resolves.toBe("RECONCILIATION_REQUIRED");
      expect(mocks.emailVerified).not.toHaveBeenCalled();
      expect(mocks.globalHash).not.toHaveBeenCalled();
      expect(mocks.authorize).not.toHaveBeenCalled();
      expect(mocks.complete).not.toHaveBeenCalled();
      expect(send).not.toHaveBeenCalled();
    },
  );

  it("loads only a live, exact worker/fence and request-digest claim", async () => {
    await dispatchClaimedOutbound(claim, "worker-1", {
      send: async () => ({ kind: "UNKNOWN" }),
    });
    const sql = new PgDialect().sqlToQuery(mocks.execute.mock.calls[0]![0]).sql;
    expect(sql).toContain("status = 'CLAIMED'");
    expect(sql).toContain("claimed_by = ");
    expect(sql).toContain("claim_fence = ");
    expect(sql).toContain("claim_expires_at > clock_timestamp()");
    expect(sql).toContain("request_digest = ");
  });

  it("does not claim any EMAIL row while sender approval is missing", async () => {
    mocks.emailVerified.mockRejectedValue(new Error("GLOBAL_EMAIL_SUPPRESSION_NOT_VERIFIED"));
    const send = vi.fn();
    await expect(dispatchDueOutboundBatch("worker-1", { send }, 10))
      .rejects.toThrow("GLOBAL_EMAIL_SUPPRESSION_NOT_VERIFIED");
    expect(mocks.claim).not.toHaveBeenCalled();
    expect(mocks.execute).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it("preflights EMAIL approval before the first batch claim", async () => {
    const send = vi.fn();
    await expect(dispatchDueOutboundBatch("worker-1", { send }, 5))
      .resolves.toMatchObject({ claimed: 0, requiresReconciliation: false });
    expect(mocks.emailVerified).toHaveBeenCalledTimes(1);
    expect(mocks.claim).toHaveBeenCalledTimes(1);
    expect(send).not.toHaveBeenCalled();
  });

  it("never dispatches an empty or unowned queue batch when disabled", async () => {
    mocks.outboundReady.mockReturnValue(false);
    const send = vi.fn();
    await expect(dispatchDueOutboundBatch("worker-1", { send }))
      .rejects.toThrow();
    expect(mocks.claim).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });
});
