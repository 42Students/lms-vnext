import { sql } from "drizzle-orm";
import {
  check,
  index,
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
    index(
      "in_app_notifications_user_read_time_idx",
    ).on(
      table.userId,
      table.readAt,
      table.createdAt,
    ),
    check(
      "in_app_notifications_shape_ck",
      sql`length(trim(${table.title})) > 0 and length(trim(${table.body})) > 0`,
    ),
  ],
);
