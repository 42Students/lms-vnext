import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { courseSectionDeliveries } from "./courses";
import { collegeMemberships } from "./memberships";
import { users } from "./users";

export const courseDiscussionMessages = pgTable(
  "course_discussion_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    deliveryId: uuid("delivery_id")
      .notNull()
      .references(
        () => courseSectionDeliveries.id,
        { onDelete: "cascade" },
      ),
    senderMembershipId: uuid(
      "sender_membership_id",
    )
      .notNull()
      .references(
        () => collegeMemberships.id,
        { onDelete: "restrict" },
      ),
    senderRole: varchar("sender_role", {
      length: 24,
    }).notNull(),
    messageText: text("message_text").notNull(),
    /** Trusted sender name at send time, never client submitted. */
    senderNameSnapshot: varchar("sender_name_snapshot", { length: 160 }),
    pinned: boolean("pinned")
      .notNull()
      .default(false),
    pinnedByUserId: uuid(
      "pinned_by_user_id",
    ).references(() => users.id, {
      onDelete: "restrict",
    }),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index(
      "course_discussion_messages_delivery_created_idx",
    ).on(table.deliveryId, table.createdAt),
    index(
      "course_discussion_messages_delivery_pinned_idx",
    ).on(table.deliveryId, table.pinned),
    check(
      "course_discussion_messages_sender_role_ck",
      sql`${table.senderRole} in ('LEARNER', 'FACULTY', 'ADMIN')`,
    ),
    check(
      "course_discussion_messages_text_ck",
      sql`length(trim(${table.messageText})) between 1 and 4000`,
    ),
    check(
      "course_discussion_messages_deleted_after_create_ck",
      sql`${table.deletedAt} is null or ${table.deletedAt} >= ${table.createdAt}`,
    ),
    check(
      "course_discussion_messages_pin_ck",
      sql`(${table.pinned} = false and ${table.pinnedByUserId} is null)
        or (${table.pinned} = true and ${table.pinnedByUserId} is not null)`,
    ),
  ],
);
