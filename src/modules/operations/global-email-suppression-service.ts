import "server-only";

import { sql } from "drizzle-orm";
import { getDb } from "@/db/client";

/**
 * A write-only persistence boundary for a *verified* email opt-out, hard
 * bounce, or complaint. The caller MUST first authenticate a purpose-bound
 * unsubscribe token or verify the provider's signed event; a raw recipient
 * hash from a browser is NOT proof.
 *
 * Public responses must not expose insertion status, previous suppression
 * membership, tenant identity or the number of pending messages cancelled.
 * Never pass raw addresses, messages or invitation tokens to this function.
 */
export type VerifiedGlobalEmailSuppression = {
  recipientHash: string;
  reason: "UNSUBSCRIBED" | "BOUNCE" | "COMPLAINT";
  sourceEventId?: string | null;
};

const HASH = /^[0-9a-f]{64}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class GlobalEmailSuppressionUnavailable extends Error {
  constructor() {
    super("GLOBAL_EMAIL_SUPPRESSION_UNAVAILABLE");
    this.name = "GlobalEmailSuppressionUnavailable";
  }
}

/**
 * A global EMAIL opt-out remains necessary when the sender is disabled.
 * Never gate opt-out writes on DB10_OUTBOUND_DISPATCH_READY or on live
 * provider configuration: a user must be able to withdraw consent before
 * a sender is activated.
 *
 * The INSERT and cancellation of definitively unsent PENDING/RETRY messages
 * share a transaction. CLAIMED messages remain quarantined and MUST be
 * denied by the DB-067 exact-fence pre-send check; a crash-ambiguous provider
 * attempt must never be rewritten as definitely unsent.
 */
export async function persistVerifiedGlobalEmailSuppression(
  verified: VerifiedGlobalEmailSuppression,
): Promise<void> {
  if (!verified || !HASH.test(verified.recipientHash) ||
      !["UNSUBSCRIBED", "BOUNCE", "COMPLAINT"].includes(verified.reason) ||
      (verified.sourceEventId != null &&
       !UUID.test(verified.sourceEventId))) {
    throw new GlobalEmailSuppressionUnavailable();
  }

  const db = getDb();
  await db.transaction(async (tx) => {
    const readiness = await tx.execute<{
      global_ready: boolean;
      outbound_ready: boolean;
    }>(sql`
      select
        to_regclass('public.outbound_global_email_suppressions') is not null
          as global_ready,
        to_regclass('public.outbound_messages') is not null
          as outbound_ready
    `);
    // A person must be able to withdraw EMAIL consent even before the
    // outbox migration is installed. The global suppression table is the
    // durable consent record; the outbox is optional only when absent.
    // If an outbox exists, its unsent cancellation remains mandatory and
    // transactional: any SQL error rolls back the consent writer.
    if (readiness.rows[0]?.global_ready !== true) {
      throw new GlobalEmailSuppressionUnavailable();
    }

    // The partial active unique index makes duplicate token POSTs and
    // competing provider events idempotent. Keep earlier suppression history.
    await tx.execute(sql`
      insert into outbound_global_email_suppressions
        (recipient_hash, reason, source_event_id)
      values (
        ${verified.recipientHash}, ${verified.reason},
        ${verified.sourceEventId ?? null}::uuid
      )
      on conflict (recipient_hash) where cleared_at is null do nothing
    `);

    // A reusable global recipient HMAC is deliberately NOT stored in each
    // outbox row. Rebuild that row's committed digest from its UUID and the
    // verified global hash. This cannot contact or enumerate other tenants.
    // A CLAIMED row is NOT overwritten: a provider may already have accepted
    // it, and the pre-send fence is its suppression check.
    if (readiness.rows[0]?.outbound_ready === true) {
      await tx.execute(sql`
      update outbound_messages as message
      set status = 'SUPPRESSED',
          next_attempt_at = null,
          last_safe_failure_code = 'GLOBAL_EMAIL_SUPPRESSION',
          updated_at = clock_timestamp()
      where message.channel = 'EMAIL'
        and message.status in ('PENDING', 'RETRY')
        and message.global_email_hash_commitment =
          encode(sha256(convert_to(
            'db10-global-email-binding-v1:' ||
              message.id::text || ':' || ${verified.recipientHash},
            'UTF8'
          )), 'hex')
      `);
    }
  });
}
