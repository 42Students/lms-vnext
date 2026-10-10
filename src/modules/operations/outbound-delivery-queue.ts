import "server-only";
import { sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import {
  OutboundDeliveryError,
  parseOutboundIntent,
} from "./outbound-delivery-contract";
import { sealOutboundDelivery } from "./outbound-delivery-envelope";

/**
 * W06 durable queue boundary, deliberately disabled until W01 migrates the
 * isolated outbox + suppression drafts and disposable PostgreSQL tests pass.
 *
 * This does NOT dispatch email, SMS or WhatsApp. QUEUED != sent/delivered.
 * An authorized producer should call the transactional variant inside its
 * own business mutation, so intent + encrypted outbox row commit atomically.
 */
type OutboundWriter = Pick<ReturnType<typeof getDb>, "execute">;

export function outboundQueueRuntimeEnabled() {
  return process.env.DB10_OUTBOUND_READY === "DB10_VERIFIED";
}

export type OutboundQueueResult =
  | { status: "QUEUED"; id: string }
  | { status: "ALREADY_QUEUED"; id: string }
  | { status: "SUPPRESSED"; id: null };

type QueueInsertionRow = {
  inserted_id: string | null;
  suppressed: boolean;
};
type ExistingRow = {
  id: string;
  request_digest: string;
};

/**
 * Every sender MUST separately re-check durable unsubscribe/bounce before
 * provider dispatch; an unsubscribe can race after this SQL statement.
 */
export async function queueOutboundDeliveryInTransaction(
  db: OutboundWriter,
  context: RequestContext,
  rawIntent: unknown,
): Promise<OutboundQueueResult> {
  if (!outboundQueueRuntimeEnabled()) {
    throw new OutboundDeliveryError("OUTBOUND_QUEUE_DISABLED");
  }
  const intent = parseOutboundIntent(rawIntent);

  // W05/Recruiter invitation templates require persisted TPO or selected
  // Admin placement management permission. Never trust the college in JSON.
  requirePermission(context, "placements.manage", {
    organizationId: intent.organizationId,
    collegeId: intent.collegeId,
  });

  // Organization/college IDs are sourced from the producer and still must
  // agree with persisted active tenancy. A forged pair cannot cross tenants.
  const verifiedScope = await db.execute<{ valid: boolean }>(sql`
    select exists (
      select 1 from colleges c
      inner join organizations o on o.id = c.organization_id
      where c.id = ${intent.collegeId}
        and c.organization_id = ${intent.organizationId}
        and c.status = 'ACTIVE'
        and o.status = 'ACTIVE'
    ) as valid
  `);
  if (verifiedScope.rows[0]?.valid !== true) {
    throw new OutboundDeliveryError("OUTBOUND_SCOPE_INVALID");
  }

  const encryptionKey = process.env.DB10_OUTBOUND_ENCRYPTION_KEY_BASE64 ?? "";
  const envelope = sealOutboundDelivery(intent, encryptionKey);
  const notBefore = envelope.notBefore
    ? new Date(envelope.notBefore) : null;
  const expiresAt = envelope.expiresAt
    ? new Date(envelope.expiresAt) : null;

  // Enqueue only when no *currently active* suppression exists.
  // Business idempotency is atomic via the unique index, not a read-check.
  // Invitation token, recipient PII and variables are exclusively ciphertext.
  const inserted = await db.execute<QueueInsertionRow>(sql`
    with inserted as (
      insert into outbound_messages (
        id, organization_id, college_id, source_event_id,
        channel, template_key, recipient_hash, idempotency_key,
        request_digest, key_id, nonce_base64, tag_base64,
        ciphertext_base64, status, not_before, expires_at
      )
      select
        ${envelope.id}, ${envelope.organizationId}, ${envelope.collegeId},
        ${envelope.sourceEventId}, ${envelope.channel},
        ${envelope.templateKey}, ${envelope.recipientHash},
        ${envelope.idempotencyKey}, ${envelope.requestDigest},
        ${envelope.keyId}, ${envelope.nonceBase64},
        ${envelope.tagBase64}, ${envelope.ciphertextBase64},
        'PENDING', ${notBefore}, ${expiresAt}
      where not exists (
        select 1 from outbound_suppressions s
        where s.organization_id = ${envelope.organizationId}
          and s.channel = ${envelope.channel}
          and s.recipient_hash = ${envelope.recipientHash}
          and s.cleared_at is null
      )
      on conflict (idempotency_key) do nothing
      returning id
    )
    select
      (select id from inserted) as inserted_id,
      exists(
        select 1 from outbound_suppressions s
        where s.organization_id = ${envelope.organizationId}
          and s.channel = ${envelope.channel}
          and s.recipient_hash = ${envelope.recipientHash}
          and s.cleared_at is null
      ) as suppressed
  `);
  const row = inserted.rows[0];
  if (row?.suppressed) {
    return { status: "SUPPRESSED", id: null };
  }
  if (row?.inserted_id) {
    return { status: "QUEUED", id: row.inserted_id };
  }

  // Concurrent identical submissions must agree on their sealed payload.
  // Reissuing an invite token under the same sourceEventId is a conflict,
  // NEVER a silent drop, and NEVER cause a second external send.
  const existing = await db.execute<ExistingRow>(sql`
    select id, request_digest
    from outbound_messages
    where idempotency_key = ${envelope.idempotencyKey}
      and organization_id = ${envelope.organizationId}
      and college_id = ${envelope.collegeId}
    limit 1
  `);
  const duplicate = existing.rows[0];
  if (!duplicate || duplicate.request_digest !== envelope.requestDigest) {
    throw new OutboundDeliveryError("OUTBOUND_IDEMPOTENCY_CONFLICT");
  }
  return { status: "ALREADY_QUEUED", id: duplicate.id };
}

export async function queueOutboundDelivery(
  context: RequestContext,
  rawIntent: unknown,
) {
  return queueOutboundDeliveryInTransaction(getDb(), context, rawIntent);
}
