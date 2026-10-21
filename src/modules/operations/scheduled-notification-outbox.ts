import "server-only";
import { sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { safeNotificationActionHref } from "@/modules/activity/notification-action";
import { scheduledRecipientIdempotencyKey } from "./scheduled-job-runner";

/**
 * Persist one recipient/event/IST window before any outward delivery. The
 * registered 0214 outbox has a unique partial index on dedupe_key.
 * This is intentionally not a direct email/SMS/SSE sender: a retry after
 * process loss can only find the same pending outbox row.
 */
export async function queueScheduledRecipientNotification(input: {
  organizationId: string;
  collegeId: string;
  sourceEventId: string;
  recipientUserId: string;
  authoredByUserId: string;
  kind: string;
  windowKey: string;
  scheduledAt: Date;
  title: string;
  body: string;
  actionHref?: string | null;
}): Promise<"QUEUED" | "ALREADY_QUEUED"> {
  if (process.env.DB10_NOTIFICATION_OUTBOX_READY !== "DB10_VERIFIED") {
    throw new Error("SCHEDULED_NOTIFICATION_OUTBOX_NOT_READY");
  }
  if (!(input.scheduledAt instanceof Date) ||
      !Number.isFinite(input.scheduledAt.getTime())) {
    throw new Error("INVALID_SCHEDULED_NOTIFICATION_DATE");
  }
  const title = input.title.trim();
  const body = input.body.trim();
  if (!title || title.length > 240 || !body || body.length > 2000 ||
      (input.actionHref != null &&
       safeNotificationActionHref(input.actionHref) !== input.actionHref)) {
    throw new Error("INVALID_SCHEDULED_NOTIFICATION_CONTENT");
  }
  const dedupeKey = scheduledRecipientIdempotencyKey(input,
    process.env.DB10_NOTIFICATION_DEDUPE_KEY_BASE64 ?? "");
  // This store never accepts request-selected recipients. Both the authored
  // event's tenant and an active recipient membership must be persisted.
  // Never mark an outbox row SENT here, or claim delivery from a queue write.
  const result = await getDb().execute<{ id: string }>(sql`
    insert into notification_delivery_outbox (
      event_id, college_id, organization_id, authored_by_user_id,
      recipient_selection, scheduled_at, dedupe_key
    )
    select
      e.id, c.id, c.organization_id, ${input.authoredByUserId}::uuid,
      ${JSON.stringify({ type: "EXPLICIT_USER", userId: input.recipientUserId, title, body, actionHref: input.actionHref ?? null })}::jsonb,
      ${input.scheduledAt}, ${dedupeKey}
    from activity_events e
    join colleges c on c.id = e.college_id
    where e.id = ${input.sourceEventId}::uuid
      and c.id = ${input.collegeId}::uuid
      and c.organization_id = ${input.organizationId}::uuid
      and c.status = 'ACTIVE'
      and exists (
        select 1 from organizations o
        where o.id = c.organization_id and o.status = 'ACTIVE'
      )
      and exists (
        select 1 from users actor
        where actor.id = ${input.authoredByUserId}::uuid
          and actor.platform_status = 'ACTIVE'
      )
      and exists (
        select 1 from college_memberships m
        join users u on u.id = m.user_id
        where m.college_id = c.id
          and m.user_id = ${input.recipientUserId}::uuid
          and m.status = 'ACTIVE'
          and u.platform_status = 'ACTIVE'
      )
    on conflict (dedupe_key) where dedupe_key is not null do nothing
    returning id
  `);
  if (result.rows[0]) return "QUEUED";
  const found = await getDb().execute<{ id: string }>(sql`
    select id from notification_delivery_outbox
    where dedupe_key = ${dedupeKey}
      and organization_id = ${input.organizationId}::uuid
      and college_id = ${input.collegeId}::uuid
    limit 1
  `);
  if (found.rows[0]) return "ALREADY_QUEUED";
  // No qualifying active in-college recipient or mismatched source event.
  throw new Error("SCHEDULED_NOTIFICATION_SCOPE_INVALID");
}
