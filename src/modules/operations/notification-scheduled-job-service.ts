import "server-only";
import { sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import type { ScheduledJobFence } from "./scheduled-job-runner";

type BatchResult = { processed: number; hasMore: boolean };

/**
 * Lock the specific lease row inside the same PostgreSQL transaction as
 * the irreversible inbox write. Holding FOR SHARE prevents a competing
 * lease takeover from committing until this batch commits/rolls back.
 */
async function guardedBatch(
  fence: ScheduledJobFence,
  action: (tx: Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0]) =>
    Promise<BatchResult>,
): Promise<BatchResult> {
  await fence.assertCurrent();
  return getDb().transaction(async (tx) => {
    const lease = fence.lease;
    const current = await tx.execute<{ job_name: string }>(sql`
      select job_name from scheduled_job_leases
      where job_name = ${lease.jobName}
        and locked_by = ${lease.holderId}
        and fence = ${lease.fence}
        and locked_until > clock_timestamp()
      for share
    `);
    if (!current.rows[0]) throw new Error("SCHEDULED_JOB_LEASE_LOST");
    return action(tx);
  });
}

/** Idempotent DB release. Scheduled receipts are invisible until SENT, and
 * the corresponding event metadata is committed in the same transaction.
 * The unique user+event index prevents duplicate inbox rows across retries.
 * A future SSE poll observes only committed releases. */
export async function releaseScheduledInAppNotifications(
  fence: ScheduledJobFence,
): Promise<BatchResult> {
  if (fence.lease.jobName !== "notification.release")
    throw new Error("INVALID_NOTIFICATION_JOB_LEASE");
  return guardedBatch(fence, async (tx) => {
    const response = await tx.execute<{ processed: number; has_more: boolean }>(sql`
      with due as (
        select id, event_id, scheduled_at from in_app_notifications
        where delivery_status = 'SCHEDULED'
          and scheduled_at <= clock_timestamp()
          and deleted_at is null
        order by scheduled_at, id
        limit 201 for update skip locked
      ), limited as (
        select id, event_id from due order by scheduled_at, id limit 200
      ), released as (
        update in_app_notifications n
        set delivery_status = 'SENT', delivered_at = clock_timestamp(),
            delivery_error = null
        from limited d
        where n.id = d.id
        returning n.event_id
      ), events as (
        update activity_events e
        set metadata = coalesce(e.metadata, '{}'::jsonb)
          || '{"deliveryStatus":"SENT"}'::jsonb
        where e.id in (select event_id from released)
        returning e.id
      )
      select (select count(*)::integer from released) as processed,
             (select count(*) from due) > 200 as has_more
    `);
    const row = response.rows[0];
    return { processed: Number(row?.processed ?? 0), hasMore: row?.has_more === true };
  });
}

/** Ninety-day soft-delete, 200 rows at a time, oldest first. Preserve
 * historical event and notification identity so audit references remain
 * valid; never delete active or newer notifications. */
export async function cleanupScheduledInAppNotifications(
  fence: ScheduledJobFence,
): Promise<BatchResult> {
  if (fence.lease.jobName !== "notification.cleanup")
    throw new Error("INVALID_NOTIFICATION_JOB_LEASE");
  return guardedBatch(fence, async (tx) => {
    const response = await tx.execute<{ processed: number; has_more: boolean }>(sql`
      with due as (
        select id, created_at from in_app_notifications
        where deleted_at is null
          and created_at < clock_timestamp() - interval '90 days'
        order by created_at, id
        limit 201 for update skip locked
      ), limited as (select id from due order by created_at, id limit 200),
      removed as (
        update in_app_notifications n
        set deleted_at = clock_timestamp()
        from limited d
        where n.id = d.id returning n.id
      )
      select (select count(*)::integer from removed) as processed,
             (select count(*) from due) > 200 as has_more
    `);
    const row = response.rows[0];
    return { processed: Number(row?.processed ?? 0), hasMore: row?.has_more === true };
  });
}


type DueOutboxRow = {
  id: string;
  event_id: string;
  organization_id: string | null;
  college_id: string | null;
  recipient_selection: unknown;
};

/**
 * Dispatch only the explicitly scoped, producer-authored in-app outbox shape.
 * The UNIQUE dedupe_key prevents repeated enqueue; UNIQUE(user_id,event_id)
 * makes release idempotent even when a retry observes an earlier commit.
 * Unrecognized delivery shapes fail closed, never become free-text SMS/email.
 */
export async function releaseScheduledNotificationOutbox(
  fence: ScheduledJobFence,
): Promise<BatchResult> {
  if (fence.lease.jobName !== "notification.release")
    throw new Error("INVALID_NOTIFICATION_JOB_LEASE");
  if (process.env.DB10_NOTIFICATION_OUTBOX_READY !== "DB10_VERIFIED")
    return { processed: 0, hasMore: false };
  let processed = 0;
  for (let n = 0; n < 200; n++) {
    const result = await guardedBatch(fence, async (tx) => {
      const due = await tx.execute<DueOutboxRow>(sql`
        select id, event_id, organization_id, college_id, recipient_selection
        from notification_delivery_outbox
        where deleted_at is null
          and delivery_status in ('SCHEDULED', 'FAILED')
          and scheduled_at <= clock_timestamp()
          and (next_retry_at is null or next_retry_at <= clock_timestamp())
          and delivery_attempts < 5
        order by scheduled_at, id
        limit 1 for update skip locked
      `);
      const entry = due.rows[0];
      if (!entry) return { processed: 0, hasMore: false };
      const selection = entry.recipient_selection;
      const record = selection && typeof selection === "object" &&
        !Array.isArray(selection) ? selection as Record<string, unknown> : null;
      const userId = record?.userId;
      const title = record?.title;
      const body = record?.body;
      const href = record?.actionHref;
      const validId = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
      const valid = record?.type === "EXPLICIT_USER" &&
        typeof userId === "string" && validId.test(userId) &&
        typeof title === "string" && title.trim().length > 0 && title.length <= 240 &&
        typeof body === "string" && body.trim().length > 0 && body.length <= 2000 &&
        (href === null || href === undefined ||
         (typeof href === "string" && href.startsWith("/") &&
          !href.startsWith("//") && href.length <= 1000)) &&
        typeof entry.college_id === "string" && validId.test(entry.college_id) &&
        typeof entry.organization_id === "string" && validId.test(entry.organization_id);
      let eligible = false;
      if (valid) {
        const attempt = await tx.execute<{ id: string }>(sql`
          insert into in_app_notifications (
            user_id, event_id, title, body, action_href,
            delivery_status, delivered_at
          )
          select ${userId}::uuid, e.id, ${title}, ${body}, ${href ?? null},
                 'SENT', clock_timestamp()
          from activity_events e
          join colleges c on c.id = e.college_id
          join college_memberships m on m.college_id = c.id
          join users u on u.id = m.user_id
          where e.id = ${entry.event_id}::uuid
            and e.organization_id = ${entry.organization_id}::uuid
            and c.id = ${entry.college_id}::uuid
            and c.organization_id = ${entry.organization_id}::uuid
            and c.status = 'ACTIVE'
            and m.user_id = ${userId}::uuid
            and m.status = 'ACTIVE'
            and u.platform_status = 'ACTIVE'
          on conflict (user_id, event_id) do nothing
          returning id
        `);
        eligible = Boolean(attempt.rows[0]);
        if (!eligible) {
          const existing = await tx.execute<{ present: boolean }>(sql`
            select exists (
              select 1 from in_app_notifications n
              join activity_events e on e.id = n.event_id
              where n.user_id = ${userId}::uuid
                and n.event_id = ${entry.event_id}::uuid
                and e.college_id = ${entry.college_id}::uuid
                and e.organization_id = ${entry.organization_id}::uuid
            ) as present
          `);
          eligible = existing.rows[0]?.present === true;
        }
      }
      if (eligible) {
        await tx.execute(sql`
          update activity_events
          set metadata = coalesce(metadata, '{}'::jsonb)
            || '{"deliveryStatus":"SENT"}'::jsonb
          where id = ${entry.event_id}::uuid
        `);
        await tx.execute(sql`
          update notification_delivery_outbox
          set delivery_status = 'SENT', delivered_at = clock_timestamp(),
              delivery_error = null, next_retry_at = null,
              delivery_attempts = delivery_attempts + 1,
              updated_at = clock_timestamp()
          where id = ${entry.id}::uuid
        `);
      } else {
        // A revoked recipient, stale event or malformed producer payload
        // is retried with a safe code. Never dispatch to an unknown audience.
        await tx.execute(sql`
          update notification_delivery_outbox
          set delivery_status = 'FAILED', delivery_error = 'RECIPIENT_UNAVAILABLE',
              delivery_attempts = delivery_attempts + 1,
              next_retry_at = clock_timestamp() + interval '1 hour',
              updated_at = clock_timestamp()
          where id = ${entry.id}::uuid
        `);
      }
      return { processed: 1, hasMore: false };
    });
    if (!result.processed) break;
    processed += 1;
  }
  return { processed, hasMore: processed === 200 };
}
