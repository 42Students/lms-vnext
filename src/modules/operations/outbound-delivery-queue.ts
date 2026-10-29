import "server-only";
import { and, count, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { isSuperAdmin, type RequestContext } from "@/modules/identity/context";
import { messagingSmsDeliveryAttempts } from "@/db/schema/messaging-receipts";
import { AuthorizationError, requirePermission } from "@/modules/permissions/policy";
import {
  OutboundDeliveryError,
  parseOutboundIntent,
} from "./outbound-delivery-contract";
import { bindGlobalEmailSuppressionHashToOutbox, deriveGlobalEmailSuppressionHash, sealOutboundDelivery } from "./outbound-delivery-envelope";
import {
  validOutboundCompletion,
  type OutboundCompletionInput,
} from "./outbound-dispatch-completion";

/**
 * W06 durable queue boundary, deliberately disabled until W01 migrates the
 * isolated outbox + suppression drafts and disposable PostgreSQL tests pass.
 *
 * This does NOT dispatch email, SMS or WhatsApp. QUEUED != sent/delivered.
 * Scheduled in-app notifications use their own 200-row release batch;
 * announcements must not be routed as free-text SMS without DLT approval.
 * An authorized producer should call the transactional variant inside its
 * own business mutation, so intent + encrypted outbox row commit atomically.
 */
type OutboundWriter = Pick<ReturnType<typeof getDb>, "execute">;

export function outboundQueueRuntimeEnabled() {
  return process.env["DB10_OUTBOUND_READY"] === "DB10_VERIFIED";
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
  // No SMS/WhatsApp recruiter invitation DLT/consent registry is approved.
  // Refuse those commands at producer entry, instead of leasing a row that
  // the EMAIL-only dispatcher must quarantine forever. The schema retains
  // future channels without claiming the transport is production-ready.
  if (intent.channel !== "EMAIL") {
    throw new OutboundDeliveryError("INVALID_OUTBOUND_INTENT");
  }

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

  const encryptionKey = process.env["DB10_OUTBOUND_ENCRYPTION_KEY_BASE64"] ?? "";
  const envelope = sealOutboundDelivery(intent, encryptionKey);
  // Global email recipient HMAC is intentionally different from the
  // organization-scoped recipientHash. Null for SMS and WhatsApp.
  const globalEmailSuppressionHash = deriveGlobalEmailSuppressionHash(
    intent,
    process.env["DB10_GLOBAL_EMAIL_HMAC_KEY_BASE64"] ?? "",
  );
  // A unique per-message commitment lets the dispatcher prove its global
  // EMAIL opt-out HMAC matches the queued recipient without storing that
  // cross-tenant linkable HMAC in the outbox table.
  const globalEmailHashCommitment = bindGlobalEmailSuppressionHashToOutbox(
    envelope.id, globalEmailSuppressionHash,
  );
  const notBefore = envelope.notBefore
    ? new Date(envelope.notBefore) : null;
  const expiresAt = envelope.expiresAt
    ? new Date(envelope.expiresAt) : null;

  // Enqueue only when no active local OR EMAIL-global suppression exists.
  // The sender MUST recheck both immediately before dispatch; statement
  // snapshot checks cannot resolve a concurrent unsubscribe/send race.
  // Business idempotency is atomic via the unique index, not a read-check.
  // Invitation token, recipient PII and variables are exclusively ciphertext.
  const inserted = await db.execute<QueueInsertionRow>(sql`
    with inserted as (
      insert into outbound_messages (
        id, organization_id, college_id, source_event_id,
        channel, template_key, recipient_hash, global_email_hash_commitment, idempotency_key,
        request_digest, key_id, nonce_base64, tag_base64,
        ciphertext_base64, status, not_before, expires_at
      )
      select
        ${envelope.id}, ${envelope.organizationId}, ${envelope.collegeId},
        ${envelope.sourceEventId}, ${envelope.channel},
        ${envelope.templateKey}, ${envelope.recipientHash},
        ${globalEmailHashCommitment}, ${envelope.idempotencyKey}, ${envelope.requestDigest},
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
        and not exists (
          select 1 from outbound_global_email_suppressions g
          where ${envelope.channel} = 'EMAIL'
            and g.recipient_hash = ${globalEmailSuppressionHash}
            and g.cleared_at is null
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
      ) or exists (
        select 1 from outbound_global_email_suppressions g
        where ${envelope.channel} = 'EMAIL'
          and g.recipient_hash = ${globalEmailSuppressionHash}
          and g.cleared_at is null
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

/**
 * DB10 durable delivery integration boundary. The DB-067 SQL functions are
 * staged proposals: these operations remain FAIL-CLOSED until migration replay
 * and a privileged dispatcher DB role have been independently verified.
 * They only claim/authorize/settle persistent intents, not send providers.
 * No web request or tenant caller may be given the worker secret or SQL grant.
 */
export function outboundDispatchRuntimeEnabled() {
  return outboundQueueRuntimeEnabled() &&
    process.env["DB10_OUTBOUND_DISPATCH_READY"] === "DB10_VERIFIED";
}

export class OutboundDispatchNotReadyError extends Error {
  constructor() {
    super("OUTBOUND_DISPATCH_NOT_READY");
    this.name = "OutboundDispatchNotReadyError";
  }
}

function requireOutboundDispatchReady() {
  if (!outboundDispatchRuntimeEnabled()) throw new OutboundDispatchNotReadyError();
}

function validateDispatchWorker(value: string): string {
  if (typeof value !== "string" || !/^[A-Za-z0-9_.:-]{1,120}$/.test(value)) {
    throw new OutboundDispatchNotReadyError();
  }
  return value;
}

export type OutboundDispatchClaim = {
  messageId: string;
  fence: number;
  requestDigest: string;
};

/** Atomic, oldest-first SKIP LOCKED claim, max 100 records. The SQL routine
 * intentionally never auto-reclaims a CLAIMED row after lease expiry because
 * provider acceptance may be unknown; reconcile it before any new send. */
export async function claimOutboundDispatchBatch(
  workerRaw: string,
  batchSize = 25,
  leaseSeconds = 60,
): Promise<OutboundDispatchClaim[]> {
  requireOutboundDispatchReady();
  const worker = validateDispatchWorker(workerRaw);
  if (!Number.isSafeInteger(batchSize) || batchSize < 1 || batchSize > 100 ||
      !Number.isSafeInteger(leaseSeconds) || leaseSeconds < 5 || leaseSeconds > 300) {
    throw new OutboundDispatchNotReadyError();
  }
  const result = await getDb().execute<{
    message_id: string; fence: number; request_digest: string;
  }>(sql`
    select message_id, fence, request_digest
    from db10_claim_outbound_messages(${worker}, ${batchSize}, ${leaseSeconds})
  `);
  return result.rows.map(row => ({
    messageId: row.message_id,
    fence: row.fence,
    requestDigest: row.request_digest,
  }));
}

/** Verify the exact claim and up-to-date local + global EMAIL suppression in
 * the DB immediately BEFORE an external provider call. globalEmailHash is
 * secret-derived from the decrypted and validated payload, never user input;
 * the DB verifies its message-specific commitment and returns false if held,
 * expired or suppressed. */
export async function authorizeOutboundProviderSend(input: {
  messageId: string;
  worker: string;
  fence: number;
  globalEmailHash: string | null;
}): Promise<boolean> {
  requireOutboundDispatchReady();
  validateDispatchWorker(input.worker);
  if (!/^[0-9a-f-]{36}$/i.test(input.messageId) ||
      !Number.isSafeInteger(input.fence) || input.fence < 1 ||
      (input.globalEmailHash !== null &&
       !/^[0-9a-f]{64}$/.test(input.globalEmailHash))) {
    throw new OutboundDispatchNotReadyError();
  }
  const result = await getDb().execute<{ authorized: boolean }>(sql`
    select db10_check_outbound_pre_send(
      ${input.messageId}::uuid, ${input.worker}, ${input.fence},
      ${input.globalEmailHash}
    ) as authorized
  `);
  return result.rows[0]?.authorized === true;
}

/** Only definitely-unsent provider errors are eligible for RETRY; unknown
 * network outcomes remain CLAIMED for manual/provider reconciliation. Rows
 * may be marked provider accepted only with a real provider message id.
 * Completion uses exact holder/fence and the already-authorized pre-send fence. */
export async function completeOutboundDispatch(
  input: OutboundCompletionInput,
): Promise<boolean> {
  requireOutboundDispatchReady();
  if (!validOutboundCompletion(input)) {
    throw new OutboundDispatchNotReadyError();
  }
  const nextAttemptAt = input.nextAttemptAt ?? null;
  const result = await getDb().execute<{ completed: boolean }>(sql`
    select db10_complete_outbound_claim(
      ${input.messageId}::uuid, ${input.worker}, ${input.fence},
      ${input.outcome}, ${input.providerMessageId ?? null},
      ${input.safeFailureCode ?? null}, ${nextAttemptAt}
    ) as completed
  `);
  return result.rows[0]?.completed === true;
}

/** Bounded operational backlog counters, never plaintext recipients, provider
 * credentials, ciphertext or invitation links. QUEUED and provider-accepted
 * are different states; a stale pending queue is not a successful delivery. */
export async function inspectOutboundDispatchBacklog(): Promise<{
  pending: number;
  retry: number;
  claimed: number;
  providerAccepted: number;
  failed: number;
  oldestDueAt: Date | null;
}> {
  requireOutboundDispatchReady();
  const result = await getDb().execute<{
    pending: number | string;
    retry: number | string;
    claimed: number | string;
    provider_accepted: number | string;
    failed: number | string;
    oldest_due_at: Date | null;
  }>(sql`
    select
      count(*) filter (where status = 'PENDING')::text as pending,
      count(*) filter (where status = 'RETRY')::text as retry,
      count(*) filter (where status = 'CLAIMED')::text as claimed,
      count(*) filter (where status = 'PROVIDER_ACCEPTED')::text as provider_accepted,
      count(*) filter (where status = 'FAILED')::text as failed,
      min(coalesce(next_attempt_at, not_before, created_at)) filter
        (where status in ('PENDING','RETRY')) as oldest_due_at
    from outbound_messages
  `);
  const row = result.rows[0];
  return {
    pending: Number(row?.pending ?? 0),
    retry: Number(row?.retry ?? 0),
    claimed: Number(row?.claimed ?? 0),
    providerAccepted: Number(row?.provider_accepted ?? 0),
    failed: Number(row?.failed ?? 0),
    oldestDueAt: row?.oldest_due_at ?? null,
  };
}

/**
 * A bounded expiry sweep for definitely UNSENT PENDING/RETRY intents only.
 * The database intentionally leaves expired CLAIMED intents quarantined until
 * provider reconciliation; blindly reclaiming them can send duplicates.
 */
export async function expireUnclaimedOutboundBatch(maxRows = 100): Promise<number> {
  requireOutboundDispatchReady();
  if (!Number.isSafeInteger(maxRows) || maxRows < 1 || maxRows > 1000) {
    throw new OutboundDispatchNotReadyError();
  }
  const result = await getDb().execute<{ expired: number }>(sql`
    select db10_expire_unclaimed_outbound(${maxRows}) as expired
  `);
  return Number(result.rows[0]?.expired ?? 0);
}

export type OutboundChannelReceipt = {
  channel: "EMAIL" | "SMS" | "WHATSAPP";
  status: "PENDING" | "CLAIMED" | "RETRY" | "PROVIDER_ACCEPTED" | "DELIVERED" |
    "SUPPRESSED" | "BOUNCED" | "FAILED" | "EXPIRED";
  createdAt: Date;
  providerAcceptedAt: Date | null;
  deliveredAt: Date | null;
  safeFailureCode: string | null;
};

/**
 * Tenant-scoped, sanitized status of a producer event, NOT a delivery-attempt
 * history. No addresses, phone numbers, provider IDs, message bodies, links,
 * invitation variables or encrypted payloads are exposed. Full SMS provider
 * attempts need their own table and permissions before API parity is claimed.
 */
export async function readOutboundEventReceipts(
  context: RequestContext,
  scope: { organizationId: string; collegeId: string; sourceEventId: string },
): Promise<OutboundChannelReceipt[]> {
  requireOutboundDispatchReady();
  requirePermission(context, "placements.manage", {
    collegeId: scope.collegeId, organizationId: scope.organizationId,
  });
  if (!/^[0-9a-f-]{36}$/i.test(scope.organizationId) ||
      !/^[0-9a-f-]{36}$/i.test(scope.collegeId) ||
      !/^[0-9a-f-]{36}$/i.test(scope.sourceEventId)) {
    throw new OutboundDispatchNotReadyError();
  }
  const result = await getDb().execute<{
    channel: OutboundChannelReceipt["channel"];
    status: OutboundChannelReceipt["status"];
    created_at: Date;
    provider_accepted_at: Date | null;
    delivered_at: Date | null;
    last_safe_failure_code: string | null;
  }>(sql`
    select channel, status, created_at, provider_accepted_at, delivered_at,
           last_safe_failure_code
    from outbound_messages
    where organization_id = ${scope.organizationId}::uuid
      and college_id = ${scope.collegeId}::uuid
      and source_event_id = ${scope.sourceEventId}::uuid
    order by created_at desc limit 100
  `);
  return result.rows.map(row => ({
    channel: row.channel,
    status: row.status,
    createdAt: row.created_at,
    providerAcceptedAt: row.provider_accepted_at,
    deliveredAt: row.delivered_at,
    safeFailureCode: row.last_safe_failure_code,
  }));
}

/** Operational state deliberately reports disabled or stalled as different
 * from an empty, successful queue. A lease claim isn't proof of provider send. */
export async function inspectOutboundDispatcherReadiness(): Promise<
  | { state: "DISABLED"; reason: "DISPATCH_NOT_VERIFIED" }
  | { state: "STALLED" | "UNCONFIRMED" | "EMPTY_UNCONFIRMED"; pending: number; retry: number;
      claimed: number; failed: number; providerAccepted: number; oldestDueAt: Date | null }
> {
  if (!outboundDispatchRuntimeEnabled()) {
    return { state: "DISABLED", reason: "DISPATCH_NOT_VERIFIED" };
  }
  const backlog = await inspectOutboundDispatchBacklog();
  return {
    state: backlog.pending + backlog.retry + backlog.claimed > 0 ? "STALLED" :
      backlog.providerAccepted + backlog.failed > 0 ? "UNCONFIRMED" : "EMPTY_UNCONFIRMED",
    ...backlog,
  };
}


/**
 * Legacy support-style delivery attempt lookup, backed by the indexed,
 * registered 0162 messaging_sms_delivery_attempts ledger rather than the
 * unregistered DB31 staging table. An accepted provider response is not
 * confirmation that an SMS reached the handset.
 *
 * The lookup is deliberately restricted to a scoped SUPER_ADMIN, returns
 * only sanitized status metadata, and never exposes OTPs, full phone numbers,
 * message bodies, provider credentials or raw provider error payloads.
 */
export async function readSmsDeliveryAttemptsForSupport(
  context: RequestContext,
  query: {
    organizationId?: string | null;
    collegeId?: string | null;
    recipientSuffix?: string | null;
    purpose?: string | null;
    page?: number;
    size?: number;
  },
) {
  // An apparently privileged tenant role must not enumerate platform SMS
  // attempts. Only a current, unscoped Super Admin can search this ledger.
  if (!isSuperAdmin(context) || context.user.platformStatus !== "ACTIVE" ||
      context.adminScope?.collegeId || context.adminScope?.organizationId)
    throw new AuthorizationError("admin-scope.select");
  requirePermission(context, "admin-scope.select");
  const organizationId = query.organizationId ?? null;
  const collegeId = query.collegeId ?? null;
  if ((organizationId && !/^[0-9a-f-]{36}$/i.test(organizationId)) ||
      (collegeId && !/^[0-9a-f-]{36}$/i.test(collegeId))) {
    throw new OutboundDispatchNotReadyError();
  }
  const suffix = query.recipientSuffix?.trim() || null;
  const purpose = query.purpose?.trim() || null;
  const page = query.page ?? 0;
  const size = query.size ?? 20;
  if ((suffix && !/^[0-9]{2,4}$/.test(suffix)) ||
      (purpose && (!/^[a-zA-Z0-9._-]{1,64}$/.test(purpose))) ||
      !Number.isSafeInteger(page) || page < 0 || page > 10_000 ||
      !Number.isSafeInteger(size) || size < 1 || size > 200) {
    throw new OutboundDispatchNotReadyError();
  }
  const constraints = [
    ...(organizationId ? [eq(messagingSmsDeliveryAttempts.organizationId, organizationId)] : []),
    ...(collegeId ? [eq(messagingSmsDeliveryAttempts.collegeId, collegeId)] : []),
    ...(suffix ? [eq(messagingSmsDeliveryAttempts.recipientSuffix, suffix)] : []),
    ...(purpose ? [eq(messagingSmsDeliveryAttempts.purpose, purpose)] : []),
  ];
  const db = getDb();
  const [countRow] = await db.select({ total: count() })
    .from(messagingSmsDeliveryAttempts).where(and(...constraints));
  const rows = await db.select({
    id: messagingSmsDeliveryAttempts.id,
    attemptedAt: messagingSmsDeliveryAttempts.attemptedAt,
    recipientSuffix: messagingSmsDeliveryAttempts.recipientSuffix,
    purpose: messagingSmsDeliveryAttempts.purpose,
    outcome: messagingSmsDeliveryAttempts.outcome,
    providerStatus: messagingSmsDeliveryAttempts.providerStatus,
    providerMessageId: messagingSmsDeliveryAttempts.providerMessageId,
    errorCode: messagingSmsDeliveryAttempts.errorCode,
    safeFailureSummary: messagingSmsDeliveryAttempts.safeFailureSummary,
  }).from(messagingSmsDeliveryAttempts)
    .where(and(...constraints))
    .orderBy(desc(messagingSmsDeliveryAttempts.attemptedAt),
      desc(messagingSmsDeliveryAttempts.id))
    .limit(size).offset(page * size);
  return {
    attempts: rows,
    page, size,
    totalElements: countRow?.total ?? 0,
    totalPages: Math.ceil((countRow?.total ?? 0) / size),
    providerAcceptanceIsDelivery: false as const,
  };
}
