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
