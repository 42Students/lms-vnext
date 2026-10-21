import "server-only";
import { sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  claimDueNotificationOutboxStatement,
  settleNotificationOutboxDeliveryStatement,
} from "@/db/schema/activity";
import { safeNotificationActionHref } from "@/modules/activity/notification-action";
import { executeScheduledJobWithLease,
  type ScheduledJobLeaseStore } from "@/modules/operations/scheduled-job-runner";

type ClaimedNotification = {
  id: string; event_id: string; college_id: string | null;
  organization_id: string | null; recipient_selection: unknown;
  delivery_attempts: number;
};
type ScheduledRecipient = {
  userId: string; title: string; body: string; actionHref: string | null;
};
function parseRecipient(raw: unknown): ScheduledRecipient | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const row = raw as Record<string, unknown>;
  const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
  if (row.type !== "EXPLICIT_USER" || typeof row.userId !== "string" ||
      !uuid.test(row.userId) || typeof row.title !== "string" ||
      typeof row.body !== "string" || !row.title.trim() || !row.body.trim() ||
      row.title.length > 240 || row.body.length > 2000 ||
      (row.actionHref !== null && row.actionHref !== undefined &&
       (typeof row.actionHref !== "string" ||
        safeNotificationActionHref(row.actionHref) !== row.actionHref))) return null;
  return { userId: row.userId, title: row.title, body: row.body,
    actionHref: typeof row.actionHref === "string" ? row.actionHref : null };
}

/** Publish only after the claimed attempt, recipient, actor, activity event
 * and tenant still agree. Inbox insert + SENT CAS commit in one transaction. */
async function releaseClaimedNotification(
  claim: ClaimedNotification, recipient: ScheduledRecipient, at: Date,
): Promise<boolean> {
  return getDb().transaction(async tx => {
    const inserted = await tx.execute<{ id: string }>(sql`
      insert into in_app_notifications (
        user_id, event_id, title, body, action_href,
        scheduled_at, delivered_at, delivery_status
      )
      select m.user_id, e.id, ${recipient.title}, ${recipient.body},
             ${recipient.actionHref}, o.scheduled_at, ${at}, 'SENT'
      from notification_delivery_outbox o
      join activity_events e on e.id = o.event_id
      join colleges c on c.id = o.college_id
        and c.organization_id = o.organization_id
      join organizations org on org.id = c.organization_id
      join college_memberships m on m.college_id = c.id
        and m.user_id = ${recipient.userId}::uuid and m.status = 'ACTIVE'
      join users u on u.id = m.user_id and u.platform_status = 'ACTIVE'
      join users actor on actor.id = o.authored_by_user_id
        and actor.platform_status = 'ACTIVE'
      where o.id = ${claim.id}::uuid
        and o.event_id = ${claim.event_id}::uuid
        and o.college_id = ${claim.college_id}::uuid
        and o.organization_id = ${claim.organization_id}::uuid
        and o.delivery_status = 'PROCESSING'
        and o.delivery_attempts = ${claim.delivery_attempts}
        and o.deleted_at is null
        and c.status = 'ACTIVE' and org.status = 'ACTIVE'
        and e.college_id = c.id and e.organization_id = org.id
      on conflict (user_id, event_id) do nothing returning id
    `);
    if (inserted.rows.length === 0) {
      // A retry is an idempotent success only if that recipient remains
      // authorized; never interpret a failed insert as a sent message.
      const prior = await tx.execute<{ valid: boolean }>(sql`
        select exists (
          select 1 from in_app_notifications n
          join notification_delivery_outbox o on o.event_id = n.event_id
          join activity_events e on e.id = o.event_id
          join colleges c on c.id = o.college_id
          join organizations org on org.id = c.organization_id
          join college_memberships m on m.college_id = c.id
            and m.user_id = n.user_id and m.status = 'ACTIVE'
          join users u on u.id = m.user_id and u.platform_status = 'ACTIVE'
          join users actor on actor.id = o.authored_by_user_id
            and actor.platform_status = 'ACTIVE'
          where o.id = ${claim.id}::uuid
            and o.event_id = ${claim.event_id}::uuid
            and o.organization_id = ${claim.organization_id}::uuid
            and o.college_id = ${claim.college_id}::uuid
            and o.delivery_status = 'PROCESSING'
            and o.delivery_attempts = ${claim.delivery_attempts}
            and o.deleted_at is null
            and e.college_id = c.id and e.organization_id = org.id
            and c.status = 'ACTIVE' and org.status = 'ACTIVE'
            and n.user_id = ${recipient.userId}::uuid
            and n.deleted_at is null
        ) as valid
      `);
      if (prior.rows[0]?.valid !== true) return false;
    }
    const settled = await tx.execute<{ id: string }>(
      settleNotificationOutboxDeliveryStatement(
        claim.id, claim.delivery_attempts, { status: "SENT", at }),
    );
    // Throwing rolls back inbox insert if the worker has lost this CAS claim.
    if (settled.rows.length !== 1) throw new Error("NOTIFICATION_OUTBOX_CAS_LOST");
    return true;
  });
}
async function markFailed(claim: ClaimedNotification, at: Date) {
  const nextRetryAt = claim.delivery_attempts < 5
    ? new Date(at.getTime() + Math.min(60, Math.pow(2, claim.delivery_attempts)) * 60_000)
    : null;
  await getDb().execute(settleNotificationOutboxDeliveryStatement(
    claim.id, claim.delivery_attempts, {
      status: "FAILED", at,
      error: "Scheduled notification could not be delivered.", nextRetryAt,
    },
  ));
}

/**
 * Bind to the deployment-managed 60-second notification.release schedule.
 * This is IN_APP-only: provider HTTP calls require their own durable
 * channel-specific receipts, never retries of ambiguous email/SMS sends.
 * SSE is best-effort after commit; database visibility is authoritative.
 */
export async function runScheduledInAppReleaseJob(
  store: ScheduledJobLeaseStore,
  input: { holderId: string; now: Date;
    afterCommittedInbox?: (eventId: string, recipientUserId: string) => Promise<void> | void;
  },
) {
  if (!(input.now instanceof Date) || !Number.isFinite(input.now.getTime()))
    throw new Error("INVALID_NOTIFICATION_RELEASE_TIME");
  if (process.env.DB10_NOTIFICATION_OUTBOX_READY !== "DB10_VERIFIED")
    throw new Error("SCHEDULED_NOTIFICATION_OUTBOX_NOT_READY");
  return executeScheduledJobWithLease(store,
    { jobName: "notification.release", holderId: input.holderId, ttlMs: 5 * 60_000 },
    async fence => {
      let delivered = 0, failed = 0;
      for (let index = 0; index < 200; index++) {
        await fence.assertCurrent();
        const claimed = await getDb().execute<ClaimedNotification>(
          claimDueNotificationOutboxStatement(new Date(), 5),
        );
        const row = claimed.rows[0];
        if (!row) break;
        const recipient = parseRecipient(row.recipient_selection);
        try {
          await fence.assertCurrent();
          if (!recipient || !row.college_id || !row.organization_id)
            throw new Error("NOTIFICATION_OUTBOX_RECIPIENT_INVALID");
          const released = await releaseClaimedNotification(row, recipient, new Date());
          if (!released) throw new Error("NOTIFICATION_OUTBOX_RECIPIENT_INACTIVE");
          delivered++;
          if (input.afterCommittedInbox) {
            try { await input.afterCommittedInbox(row.event_id, recipient.userId); }
            catch { /* persist delivery even when a realtime push fails */ }
          }
        } catch {
          failed++;
          await markFailed(row, new Date());
        }
      }
      return { delivered, failed };
    },
  );
}
