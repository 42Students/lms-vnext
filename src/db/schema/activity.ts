import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { colleges } from "./colleges";
import { organizations } from "./organizations";
import { collegeMemberships } from "./memberships";
import { users } from "./users";

export const activityEvents = pgTable(
  "activity_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").references(
      () => organizations.id,
      { onDelete: "restrict" },
    ),
    collegeId: uuid("college_id").references(
      () => colleges.id,
      { onDelete: "restrict" },
    ),
    actorUserId: uuid("actor_user_id").references(
      () => users.id,
      { onDelete: "restrict" },
    ),
    actorMembershipId: uuid(
      "actor_membership_id",
    ).references(
      () => collegeMemberships.id,
      { onDelete: "restrict" },
    ),
    // Historic audit provenance: no raw IP, phone or user-agent.
    legacyAuditId: bigint("legacy_audit_id", { mode: "number" }),
    legacyActionLabel: varchar("legacy_action_label", {length:160}),
    legacyTargetName: varchar("legacy_target_name", {length:160}),
    legacySourceTimeZone: varchar("legacy_source_time_zone", {length:80}),
    legacyOccurredLocal: timestamp("legacy_occurred_local", {withTimezone:false}),
    legacyEventOriginalCode: varchar("legacy_event_original_code", {length:120}),
    legacyWasDeleted: boolean("legacy_was_deleted"),
    legacyActionKey: varchar("legacy_action_key", { length: 120 }),
    legacyEntityType: varchar("legacy_entity_type", { length: 80 }),
    legacyEntityId: text("legacy_entity_id"),
    actorRoleSnapshot: varchar("actor_role_snapshot", { length: 64 }),
    actorNameSnapshot: text("actor_name_snapshot"),
    legacyProjectEventKey: varchar("legacy_project_event_key", { length: 120 }),
    legacyProjectEventCode: varchar("legacy_project_event_code", { length: 80 }),
    legacyProjectId: integer("legacy_project_id"),
    actorContactLast4: varchar("actor_contact_last4", { length: 4 }),
    sourceIpHash: varchar("source_ip_hash", { length: 64 }),
    sourceUserAgentFamily: varchar("source_user_agent_family", { length: 128 }),
    module: varchar("module", {
      length: 32,
    }).notNull(),
    eventType: varchar("event_type", {
      length: 120,
    }).notNull(),
    importance: varchar("importance", {
      length: 16,
    })
      .notNull()
      .default("NORMAL"),
    subjectType: varchar("subject_type", {
      length: 80,
    }).notNull(),
    subjectId: text("subject_id").notNull(),
    subjectLabel: text("subject_label"),
    summary: text("summary").notNull(),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    groupKey: text("group_key"),
    dedupeKey: text("dedupe_key"),
    occurredAt: timestamp("occurred_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("activity_events_subject_time_idx")
      .on(table.module, table.subjectType, table.subjectId, table.occurredAt),
    index("activity_events_project_event_idx")
      .on(table.legacyProjectId, table.occurredAt)
      .where(sql`${table.legacyProjectId} is not null`),
    index("activity_events_college_event_time_idx")
      .on(table.collegeId,table.eventType,table.occurredAt,table.id),
    index("activity_events_event_time_idx")
      .on(table.eventType,table.occurredAt,table.id),
    index("activity_events_group_stable_time_idx")
      .on(table.groupKey,table.occurredAt,table.id),
    index("activity_events_legacy_audit_id_idx")
      .on(table.legacyAuditId)
      .where(sql`${table.legacyAuditId} is not null`),
    index(
      "activity_events_college_time_idx",
    ).on(
      table.collegeId,
      table.occurredAt,
    ),
    index(
      "activity_events_organization_time_idx",
    ).on(
      table.organizationId,
      table.occurredAt,
    ),
    index(
      "activity_events_module_time_idx",
    ).on(table.module, table.occurredAt),
    index(
      "activity_events_actor_time_idx",
    ).on(
      table.actorUserId,
      table.occurredAt,
    ),
    index(
      "activity_events_group_time_idx",
    ).on(
      table.groupKey,
      table.occurredAt,
    ),
    uniqueIndex(
      "activity_events_dedupe_uq",
    )
      .on(table.dedupeKey)
      .where(
        sql`${table.dedupeKey} is not null`,
      ),
    check("activity_events_source_ip_hash_ck",
      sql`${table.sourceIpHash} is null or ${table.sourceIpHash} ~ '^[0-9a-f]{64}$'`),
    check("activity_events_actor_last4_ck",
      sql`${table.actorContactLast4} is null or ${table.actorContactLast4} ~ '^[0-9]{4}$'`),
    check(
      "activity_events_scope_ck",
      sql`${table.collegeId} is null or ${table.organizationId} is not null`,
    ),
    check(
      "activity_events_module_ck",
      sql`${table.module} in ('PLATFORM', 'IDENTITY', 'ACADEMICS', 'COURSES', 'PROJECTS', 'PLACEMENTS')`,
    ),
    check(
      "activity_events_importance_ck",
      sql`${table.importance} in ('LOW', 'NORMAL', 'HIGH', 'CRITICAL')`,
    ),
    check(
      "activity_events_shape_ck",
      sql`length(trim(${table.eventType})) > 0
        and length(trim(${table.subjectType})) > 0
        and length(trim(${table.subjectId})) > 0
        and length(trim(${table.summary})) > 0`,
    ),
  ],
);

export const inAppNotifications = pgTable(
  "in_app_notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "restrict",
      }),
    eventId: uuid("event_id")
      .notNull()
      .references(() => activityEvents.id, {
        onDelete: "restrict",
      }),
    title: text("title").notNull(),
    body: text("body").notNull(),
    actionHref: text("action_href"),
    legacyNotificationId: bigint("legacy_notification_id", { mode: "number" }),
    legacyNotificationType: varchar("legacy_notification_type", { length: 80 }),
    legacyOriginalTitle: text("legacy_original_title"),
    legacyContextType: varchar("legacy_context_type", {length:80}),
    legacyContextId: text("legacy_context_id"),
    legacyWasRead: boolean("legacy_was_read"),
    legacyWasDeleted: boolean("legacy_was_deleted"),
    legacySourceTimeZone: varchar("legacy_source_time_zone", {length:80}),
    legacyContextLabel: text("legacy_context_label"),
    legacyCreatorFacultyId: integer("legacy_creator_faculty_id"),
    legacyRecipientType: varchar("legacy_recipient_type", { length: 24 }),
    legacyClassId: integer("legacy_class_id"),
    legacyCourseId: integer("legacy_course_id"),
    legacyLearnerId: integer("legacy_learner_id"),
    legacyJobId: integer("legacy_job_id"),
    legacyApplicationId: integer("legacy_application_id"),
    legacyInterviewId: integer("legacy_interview_id"),
    legacyAssessmentUrl: text("legacy_assessment_url"),
    legacyCourseSlug: text("legacy_course_slug"),
    legacyCourseName: text("legacy_course_name"),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    deliveryStatus: varchar("delivery_status", { length: 24 }),
    deliveryError: text("delivery_error"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    legacyCreatedByUserId: uuid("legacy_created_by_user_id")
      .references(() => users.id, { onDelete: "restrict" }),
    readAt: timestamp("read_at", {
      withTimezone: true,
    }),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex(
      "in_app_notifications_user_event_uq",
    ).on(table.userId, table.eventId),
    uniqueIndex("in_app_notifications_user_legacy_uq")
      .on(table.userId, table.legacyNotificationId)
      .where(sql`${table.legacyNotificationId} is not null`),
    index("in_app_notifications_user_history_idx")
      .on(table.userId,table.createdAt,table.id)
      .where(sql`${table.deletedAt} is null`),
    index("in_app_notifications_user_unread_idx")
      .on(table.userId,table.createdAt,table.id)
      .where(sql`${table.readAt} is null and ${table.deletedAt} is null`),
    index("in_app_notifications_schedule_status_idx")
      .on(table.deliveryStatus, table.scheduledAt)
      .where(sql`${table.scheduledAt} is not null`),
    index(
      "in_app_notifications_user_read_time_idx",
    ).on(
      table.userId,
      table.readAt,
      table.createdAt,
    ),
    check("in_app_notifications_legacy_assessment_length_ck",
      sql`${table.legacyAssessmentUrl} is null or length(${table.legacyAssessmentUrl}) <= 2048`),
    check("in_app_notifications_delivery_error_length_ck",
      sql`${table.deliveryError} is null or length(${table.deliveryError}) <= 500`),
    check(
      "in_app_notifications_shape_ck",
      sql`length(trim(${table.title})) > 0 and length(trim(${table.body})) > 0`,
    ),
  ],
);

/**
 * Producer-owned scheduled notification rows. Inbox entries must only be
 * published after the outbox worker acquires and releases due deliveries.
 * This schema is unregistered until worker, same-college recipients and
 * retry-idempotency guarantees are implemented and verified.
 */
export const notificationDeliveryOutbox = pgTable(
  "notification_delivery_outbox",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventId: uuid("event_id").notNull()
      .references(() => activityEvents.id, { onDelete: "restrict" }),
    collegeId: uuid("college_id")
      .references(() => colleges.id, { onDelete: "restrict" }),
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "restrict" }),
    authoredByUserId: uuid("authored_by_user_id").notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    recipientSelection: jsonb("recipient_selection")
      .$type<Record<string, unknown>>().notNull(),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
    deliveryStatus: varchar("delivery_status", { length: 24 }).notNull()
      .default("SCHEDULED"),
    deliveryAttempts: integer("delivery_attempts").notNull().default(0),
    nextRetryAt: timestamp("next_retry_at", { withTimezone: true }),
    deliveryError: varchar("delivery_error", { length: 500 }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    dedupeKey: text("dedupe_key"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("notification_delivery_outbox_dedupe_uq").on(table.dedupeKey)
      .where(sql`${table.dedupeKey} is not null`),
    index("notification_delivery_outbox_due_idx")
      .on(table.deliveryStatus, table.scheduledAt, table.nextRetryAt)
      .where(sql`${table.deletedAt} is null`),
    index("notification_delivery_outbox_scope_idx")
      .on(table.organizationId, table.collegeId, table.createdAt),
    check("notification_delivery_outbox_status_ck",
      sql`${table.deliveryStatus} in ('SCHEDULED','PROCESSING','SENT','FAILED')`),
    check("notification_delivery_outbox_attempts_ck",
      sql`${table.deliveryAttempts} >= 0`),
    check("notification_delivery_outbox_status_time_ck",
      sql`${table.deliveryStatus} <> 'SENT' or ${table.deliveredAt} is not null`),
  ],
);
