/**
 * DB10 announcements schema DRAFT ONLY.
 * W01 owns migration registration/journal. This file is intentionally not
 * exported from src/db/schema/index.ts until migration replay is approved.
 *
 * Legacy source: announcements + V127 schedule/expiry/pin.
 * Normalization: receiver_value becomes UUID receiver_id and explicit
 * organization_id/college_id are persisted for tenant-safe reads.
 */
import { sql } from "drizzle-orm";
import {
  boolean, check, index, integer, pgTable, text, timestamp, uuid, varchar,
} from "drizzle-orm/pg-core";
import { colleges } from "./colleges";
import { organizations } from "./organizations";
import { users } from "./users";

export const db10Announcements = pgTable(
  "announcements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    collegeId: uuid("college_id").notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),
    receiverType: varchar("receiver_type", { length: 24 }).notNull(),
    receiverId: uuid("receiver_id").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message").notNull(),
    senderUserId: uuid("sender_user_id").notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    senderType: varchar("sender_type", { length: 32 }).notNull(),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    isPinned: boolean("is_pinned").notNull().default(false),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    deletedByUserId: uuid("deleted_by_user_id")
      .references(() => users.id, { onDelete: "restrict" }),
    version: integer("version").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("db10_announcements_scope_deleted_time_idx")
      .on(t.collegeId, t.deletedAt, t.createdAt),
    index("db10_announcements_org_deleted_time_idx")
      .on(t.organizationId, t.deletedAt, t.createdAt),
    index("db10_announcements_recipient_visibility_idx")
      .on(t.receiverType, t.receiverId, t.deletedAt, t.scheduledAt, t.expiresAt, t.isPinned),
    check(
      "db10_announcements_receiver_type_ck",
      sql\`${t.receiverType} in ('COLLEGE','PROGRAM','DEPARTMENT','LEARNER','FACULTY','CLASS')\`,
    ),
    check(
      "db10_announcements_sender_type_ck",
      sql\`${t.senderType} in ('SUPER_ADMIN','COLLEGE_ADMIN','FACULTY','LEARNER','TPO','SYSTEM')\`,
    ),
    check("db10_announcements_version_ck", sql\`${t.version} >= 0\`),
    check(
      "db10_announcements_schedule_order_ck",
      sql\`${t.expiresAt} is null or ${t.scheduledAt} is null or ${t.expiresAt} > ${t.scheduledAt}\`,
    ),
    check(
      "db10_announcements_delete_shape_ck",
      sql\`(${t.deletedAt} is null and ${t.deletedByUserId} is null)
        or (${t.deletedAt} is not null and ${t.deletedByUserId} is not null)\`,
    ),
  ],
);
