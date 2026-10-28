import "server-only";
import { sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  openOutboundDelivery,
  deriveGlobalEmailSuppressionHashForAddress,
  type SealedOutboundDelivery,
} from "./outbound-delivery-envelope";
import {
  authorizeOutboundProviderSend,
  completeOutboundDispatch,
  outboundDispatchRuntimeEnabled,
  OutboundDispatchNotReadyError,
} from "./outbound-delivery-queue";
import {
  executeClaimedOutbound,
  type OutboundClaim,
  type OutboundClaimResult,
  type OpenedOutboundClaim,
  type TrustedProviderResult,
} from "./outbound-dispatch-orchestration";
import type { OutboundDeliveryIntent } from "./outbound-delivery-contract";

/** A trusted worker supplies the transport after independent verification.
 * Never mount this runner on a public/tenant API route. */
export type TrustedOutboundProvider = {
  send: (intent: OutboundDeliveryIntent) => Promise<TrustedProviderResult>;
};

type ClaimRow = {
  id: string;
  organization_id: string;
  college_id: string;
  source_event_id: string;
  channel: SealedOutboundDelivery["channel"];
  template_key: SealedOutboundDelivery["templateKey"];
  recipient_hash: string;
  idempotency_key: string;
  request_digest: string;
  key_id: string;
  nonce_base64: string;
  ciphertext_base64: string;
  tag_base64: string;
  not_before: Date | null;
  expires_at: Date | null;
  attempts: number;
};

/** Load only the exact current worker/fence, verify the authenticated
 * envelope, then derive the global EMAIL opt-out HMAC from the true recipient.
 * Never log or expose the decrypted recipient/invitation URL/token.
 */
async function openLiveOutboundClaim(
  claim: OutboundClaim,
  worker: string,
): Promise<OpenedOutboundClaim | null> {
  const result = await getDb().execute<ClaimRow>(sql`
    select id, organization_id, college_id, source_event_id,
      channel, template_key, recipient_hash, idempotency_key, request_digest,
      key_id, nonce_base64, ciphertext_base64, tag_base64,
      not_before, expires_at, attempts
    from outbound_messages
    where id = ${claim.messageId}::uuid
      and status = 'CLAIMED'
      and claimed_by = ${worker}
      and claim_fence = ${claim.fence}
      and request_digest = ${claim.requestDigest}
    limit 1
  `);
  const row = result.rows[0];
  if (!row || row.key_id !== "v1") return null;
  const sealed: SealedOutboundDelivery = {
    id: row.id,
    schemaVersion: 1,
    keyId: "v1",
    organizationId: row.organization_id,
    collegeId: row.college_id,
    sourceEventId: row.source_event_id,
    channel: row.channel,
    templateKey: row.template_key,
    recipientHash: row.recipient_hash,
    idempotencyKey: row.idempotency_key,
    requestDigest: row.request_digest,
    nonceBase64: row.nonce_base64,
    ciphertextBase64: row.ciphertext_base64,
    tagBase64: row.tag_base64,
    notBefore: row.not_before?.toISOString() ?? null,
    expiresAt: row.expires_at?.toISOString() ?? null,
  };
  const intent = openOutboundDelivery(
    sealed, process.env["DB10_OUTBOUND_ENCRYPTION_KEY_BASE64"] ?? "",
  );
  const globalEmailHash = intent.channel === "EMAIL"
    ? deriveGlobalEmailSuppressionHashForAddress(
        intent.recipient,
        process.env["DB10_GLOBAL_EMAIL_HMAC_KEY_BASE64"] ?? "",
      )
    : null;
  return { intent, attempts: Number(row.attempts), globalEmailHash };
}

/** Process a previously leased message once. There is no automatic reclaim
 * or provider call unless BOTH readiness flags and DB pre-send checks pass.
 * Unknown outcomes remain CLAIMED pending provider reconciliation.
 */
export async function dispatchClaimedOutbound(
  claim: OutboundClaim,
  worker: string,
  provider: TrustedOutboundProvider,
): Promise<OutboundClaimResult> {
  if (!outboundDispatchRuntimeEnabled()) throw new OutboundDispatchNotReadyError();
  return executeClaimedOutbound(claim, worker, {
    load: openLiveOutboundClaim,
    authorize: authorizeOutboundProviderSend,
    complete: completeOutboundDispatch,
    send: intent => provider.send(intent),
    now: () => new Date(),
  });
}
