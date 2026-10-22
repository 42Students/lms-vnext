import "server-only";
import { sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { safeNotificationActionHref } from "@/modules/activity/notification-action";
import { tomorrowInIndiaUtcWindow, type ScheduledJobFence } from "./scheduled-job-runner";

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
  if (process.env["DB10_NOTIFICATION_OUTBOX_READY"] !== "DB10_VERIFIED")
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
      const userId = record?.["userId"];
      const title = record?.["title"];
      const body = record?.["body"];
      const href = record?.["actionHref"];
      const validId = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
      const valid = record?.["type"] === "EXPLICIT_USER" &&
        typeof userId === "string" && validId.test(userId) &&
        typeof title === "string" && title.trim().length > 0 && title.length <= 240 &&
        typeof body === "string" && body.trim().length > 0 && body.length <= 2000 &&
        (href === null || href === undefined ||
         (typeof href === "string" && href.length <= 1000 &&
          safeNotificationActionHref(href) === href)) &&
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
              join colleges c on c.id = e.college_id
              join college_memberships m on m.college_id = c.id
              join users u on u.id = m.user_id
              where n.user_id = ${userId}::uuid
                and n.event_id = ${entry.event_id}::uuid
                and e.college_id = ${entry.college_id}::uuid
                and e.organization_id = ${entry.organization_id}::uuid
                and c.status = 'ACTIVE'
                and m.user_id = ${userId}::uuid
                and m.status = 'ACTIVE'
                and u.platform_status = 'ACTIVE'
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
    // Each row commits independently. Renew only between fenced database
    // transactions so a long 200-row release cannot silently lose its lease.
    if (processed % 20 === 0) await fence.renew();
  }
  return { processed, hasMore: processed === 200 };
}

/**
 * Candidate-slot reminders use BOOKED per-learner slots rather than a broad
 * job's interview round. This excludes withdrawn applications, cancelled
 * slots and non-members, and never copies private interviewer feedback.
 *
 * All three job names share the same event dedupe identity for a phase, slot,
 * version and recipient. Competing legacy/TPO triggers cannot double-notify.
 * An event and its SENT inbox row are created in one fenced transaction.
 * This adapter does not claim an email was sent; email has its own outbox.
 */
export async function queueFencedInterviewReminders(
  fence: ScheduledJobFence,
  phase: "TOMORROW" | "TODAY",
  now = new Date(),
): Promise<BatchResult> {
  const expected = phase === "TOMORROW"
    ? ["notification.interviewReminders", "tpo.interviewReminders"]
    : ["tpo.interviewMorningReminders"];
  if (!expected.includes(fence.lease.jobName)) throw new Error("INVALID_INTERVIEW_REMINDER_LEASE");
  if (!(now instanceof Date) || !Number.isFinite(now.getTime()))
    throw new Error("INVALID_INTERVIEW_REMINDER_TIME");
  const tomorrow = tomorrowInIndiaUtcWindow(now);
  const from = phase === "TOMORROW"
    ? tomorrow.from : new Date(tomorrow.from.getTime() - 86_400_000);
  const to = phase === "TOMORROW" ? tomorrow.to : tomorrow.from;
  const kind = phase === "TOMORROW" ? "INTERVIEW_REMINDER_TOMORROW" : "INTERVIEW_REMINDER_TODAY";
  const title = phase === "TOMORROW" ? "Interview tomorrow" : "Interview today";
  // The channel-aware legacy template has IN_APP, EMAIL and SMS routes.
  // This fenced producer delivers IN_APP only. External provider channels
  // need their separate audited encrypted outbox and DLT/template gates;
  // neither an in-app SENT status nor a provider acknowledgment proves them.
  const channelPolicy = "INTERVIEW_REMINDER";
  return guardedBatch(fence, async (tx) => {
    const result = await tx.execute<{processed:number;has_more:boolean}>(sql`
      with eligible as materialized (
        select s.id as slot_id, s.version as slot_version,
          s.starts_at, j.id as job_id, r.id as round_id,
          j.title as job_title, r.name as round_name,
          m.user_id, c.id as college_id, c.organization_id,
          ('scheduler:interview:' || ${phase} || ':' || s.id::text || ':'
            || s.version::text || ':' || m.user_id::text) as dedupe
        from placement_round_candidate_slots s
        join placement_job_rounds r on r.id = s.round_id
          and r.job_id = s.job_id and r.status = 'SCHEDULED'
          and r.kind = 'INTERVIEW'
        join placement_jobs j on j.id = s.job_id
          and j.status in ('PUBLISHED', 'CLOSED')
        join colleges c on c.id = j.college_id and c.status = 'ACTIVE'
        join organizations o on o.id = c.organization_id and o.status = 'ACTIVE'
        join placement_applications a on a.id = s.application_id
          and a.job_id = j.id and a.status = 'SUBMITTED'
        join college_memberships m on m.id = a.membership_id
          and m.college_id = c.id and m.status = 'ACTIVE'
        join membership_roles role on role.membership_id = m.id and role.role = 'LEARNER'
        join users u on u.id = m.user_id and u.platform_status = 'ACTIVE'
        where s.status = 'BOOKED' and s.interview_outcome is null
          and s.starts_at >= ${from} and s.starts_at < ${to}
          and s.starts_at > ${now}
          and not exists (
            select 1 from activity_events existing_event
            join in_app_notifications existing_notice
              on existing_notice.event_id = existing_event.id
            where existing_event.dedupe_key =
              ('scheduler:interview:' || ${phase} || ':' || s.id::text || ':'
                || s.version::text || ':' || m.user_id::text)
              and existing_notice.user_id = m.user_id
          )
        order by s.starts_at, s.id
        limit 201
      ), limited as materialized (
        select * from eligible order by starts_at, slot_id limit 200
      ), created_events as (
        insert into activity_events (
          organization_id, college_id, module, event_type, importance,
          subject_type, subject_id, summary, metadata, dedupe_key
        )
        select l.organization_id, l.college_id, 'PLACEMENTS', ${kind}, 'NORMAL',
          'placement_round_candidate_slot', l.slot_id::text, ${title},
          jsonb_build_object('slotId',l.slot_id,'jobId',l.job_id,
            'roundId',l.round_id,'startsAt',l.starts_at,'phase',${phase},
            'template',${channelPolicy},'channel','IN_APP',
            'externalDelivery','UNPROVISIONED'),
          l.dedupe
        from limited l
        on conflict (dedupe_key) where dedupe_key is not null do nothing
        returning id, dedupe_key
      ), created_notices as (
        insert into in_app_notifications (
          user_id, event_id, title, body, action_href, delivery_status, delivered_at
        )
        select l.user_id, e.id, ${title},
          left('Your ' || left(l.round_name,120) || ' interview for ' ||
            left(l.job_title,180) || ' is scheduled ' ||
            to_char(l.starts_at at time zone 'Asia/Kolkata','DD Mon YYYY HH12:MI AM') ||
            ' IST. Open My Placements for details.', 1900),
          '/learn/my-placements/schedule', 'SENT', clock_timestamp()
        from limited l join created_events e on e.dedupe_key = l.dedupe
        on conflict (user_id, event_id) do nothing returning id
      )
      select (select count(*)::integer from created_notices) as processed,
             (select count(*) from eligible) > 200 as has_more
    `);
    return {processed:Number(result.rows[0]?.processed??0),
      hasMore:result.rows[0]?.has_more===true};
  });
}

/**
 * Daily 09:00 IST reminders. Only PUBLISHED assignments/quizzes with a real
 * canonical dueAt in [now+12h,now+36h) are eligible. Skip submitted work,
 * inactive sections and disabled lessons. A generic lesson activity may target
 * several active course deliveries, but never a cross-college learner.
 */
export async function queueFencedCourseDueReminders(
  fence: ScheduledJobFence,
  now = new Date(),
): Promise<BatchResult> {
  if (fence.lease.jobName !== "notification.assignmentReminders")
    throw new Error("INVALID_COURSE_REMINDER_LEASE");
  if (!(now instanceof Date) || !Number.isFinite(now.getTime()))
    throw new Error("INVALID_COURSE_REMINDER_TIME");
  const from = new Date(now.getTime() + 12 * 60 * 60_000);
  const to = new Date(now.getTime() + 36 * 60 * 60_000);
  return guardedBatch(fence, async (tx) => {
    const result = await tx.execute<{processed:number;has_more:boolean}>(sql`
      with content_due as (
        select 'ASSIGNMENT'::text as kind, a.id as content_id,
          a.title, a.due_at, d.id as delivery_id, d.section_id,
          o.academic_period_id, o.cohort_id, c.id as college_id,
          c.organization_id
        from course_assignments a
        join course_lessons lesson on lesson.id = a.lesson_id
          and lesson.status = 'ACTIVE' and lesson.visible_to_students = true
          and lesson.deleted_at is null
        join course_learning_paths path on path.id = lesson.learning_path_id
          and path.status = 'PUBLISHED'
        join course_offerings o on o.id = path.offering_id
          and o.status = 'ACTIVE'
        join course_section_deliveries d on d.offering_id = o.id
          and d.ended_at is null
          and (a.delivery_id is null or a.delivery_id = d.id)
        join academic_periods period on period.id = o.academic_period_id
          and period.status = 'ACTIVE'
        join sections section on section.id = d.section_id
          and section.cohort_id = o.cohort_id
          and section.academic_period_id = period.id
          and section.status = 'ACTIVE'
        join colleges c on c.id = period.college_id and c.status = 'ACTIVE'
        join organizations org on org.id = c.organization_id and org.status = 'ACTIVE'
        where a.status = 'PUBLISHED' and a.due_at >= ${from} and a.due_at < ${to}
        union all
        select 'QUIZ'::text, q.id, q.title, q.due_at, d.id,
          d.section_id, o.academic_period_id, o.cohort_id,
          c.id, c.organization_id
        from course_quizzes q
        join course_lessons lesson on lesson.id = q.lesson_id
          and lesson.status = 'ACTIVE' and lesson.visible_to_students = true
          and lesson.deleted_at is null
        join course_learning_paths path on path.id = lesson.learning_path_id
          and path.status = 'PUBLISHED'
        join course_offerings o on o.id = path.offering_id
          and o.status = 'ACTIVE'
        join course_section_deliveries d on d.offering_id = o.id
          and d.ended_at is null
          and (q.delivery_id is null or q.delivery_id = d.id)
        join academic_periods period on period.id = o.academic_period_id
          and period.status = 'ACTIVE'
        join sections section on section.id = d.section_id
          and section.cohort_id = o.cohort_id
          and section.academic_period_id = period.id
          and section.status = 'ACTIVE'
        join colleges c on c.id = period.college_id and c.status = 'ACTIVE'
        join organizations org on org.id = c.organization_id and org.status = 'ACTIVE'
        where q.status = 'PUBLISHED' and q.due_at >= ${from} and q.due_at < ${to}
      ), eligible as materialized (
        select due.*, membership.user_id,
          ('scheduler:course:' || due.kind || ':' || due.content_id::text
            || ':' || due.delivery_id::text || ':' || membership.user_id::text
            || ':' || to_char(due.due_at at time zone 'UTC','YYYYMMDDHH24MI')) as dedupe
        from content_due due
        join section_enrollments section_member
          on section_member.section_id = due.section_id
          and section_member.academic_period_id = due.academic_period_id
          and section_member.status = 'ACTIVE'
        join learner_program_enrollments enrol
          on enrol.id = section_member.learner_enrollment_id
          and enrol.cohort_id = due.cohort_id and enrol.status = 'ACTIVE'
        join college_memberships membership
          on membership.id = enrol.membership_id
          and membership.college_id = due.college_id and membership.status = 'ACTIVE'
        join membership_roles role
          on role.membership_id = membership.id and role.role = 'LEARNER'
        join users learner on learner.id = membership.user_id
          and learner.platform_status = 'ACTIVE'
        where (
          (due.kind = 'ASSIGNMENT' and not exists (
            select 1 from assignment_submissions submitted
            where submitted.assignment_id = due.content_id
              and submitted.membership_id = membership.id
              and submitted.deleted_at is null
          )) or (due.kind = 'QUIZ' and not exists (
            select 1 from quiz_attempts attempted
            where attempted.quiz_id = due.content_id
              and attempted.membership_id = membership.id
              and attempted.deleted_at is null
          ))
        ) and not exists (
          select 1 from activity_events existing_event
          join in_app_notifications existing_notice
            on existing_notice.event_id = existing_event.id
          where existing_event.dedupe_key =
            ('scheduler:course:' || due.kind || ':' || due.content_id::text
              || ':' || due.delivery_id::text || ':' || membership.user_id::text
              || ':' || to_char(due.due_at at time zone 'UTC','YYYYMMDDHH24MI'))
            and existing_notice.user_id = membership.user_id
        )
        order by due.due_at, due.content_id, membership.user_id
        limit 201
      ), limited as materialized (
        select * from eligible order by due_at, content_id, user_id limit 200
      ), created_events as (
        insert into activity_events (
          organization_id, college_id, module, event_type, importance,
          subject_type, subject_id, summary, metadata, dedupe_key
        )
        select l.organization_id, l.college_id, 'COURSES',
          'COURSE_' || l.kind || '_DUE_REMINDER', 'NORMAL',
          lower(l.kind), l.content_id::text, l.kind || ' due soon',
          jsonb_build_object('contentId',l.content_id,
            'deliveryId',l.delivery_id,'dueAt',l.due_at,'kind',l.kind,
            'template','COURSE_ASSIGNMENT_DUE','channel','IN_APP'),
          l.dedupe
        from limited l
        on conflict (dedupe_key) where dedupe_key is not null do nothing
        returning id, dedupe_key
      ), created_notices as (
        insert into in_app_notifications (
          user_id, event_id, title, body, action_href, delivery_status, delivered_at
        )
        select l.user_id, e.id, l.kind || ' due soon',
          left(l.title,180) || ' is due soon. Open your course to complete it.',
          '/learn/courses', 'SENT', clock_timestamp()
        from limited l join created_events e on e.dedupe_key = l.dedupe
        on conflict (user_id, event_id) do nothing returning id
      )
      select (select count(*)::integer from created_notices) as processed,
             (select count(*) from eligible) > 200 as has_more
    `);
    return {processed:Number(result.rows[0]?.processed??0),
      hasMore:result.rows[0]?.has_more===true};
  });
}
