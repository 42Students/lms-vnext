import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { colleges } from "./colleges";
import { users } from "./users";

/**
 * Platform-wide announcements. ALL_COLLEGES broadcasts must have no explicit
 * target rows; SELECTED_COLLEGES requires at least one (enforced in the
 * publishing service, transactionally). No delivery fan-out is implied.
 */
export const platformBroadcasts = pgTable(
  "platform_broadcasts",
  {
    id: uuid("id").primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message").notNull(),
    linkUrl: varchar("link_url", { length: 2048 }),
    isPinned: boolean("is_pinned").notNull().default(false),
    showUntil: timestamp("show_until", { withTimezone: true }).notNull(),
    audienceMode: varchar("audience_mode", { length: 24 }).notNull(),
    status: varchar("status", { length: 16 }).notNull(),
    authorUserId: uuid("author_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    version: integer("version").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("platform_broadcasts_created_at").on(t.createdAt),
    check(
      "platform_broadcasts_audience_mode_ck",
      sql`${t.audienceMode} in ('ALL_COLLEGES', 'SELECTED_COLLEGES')`,
    ),
    check(
      "platform_broadcasts_status_ck",
      sql`${t.status} in ('DRAFT', 'PUBLISHED', 'CANCELLED')`,
    ),
    check("platform_broadcasts_version_ck", sql`${t.version} >= 0`),
  ],
);

export const platformBroadcastTargets = pgTable(
  "platform_broadcast_targets",
  {
    broadcastId: uuid("broadcast_id")
      .notNull()
      .references(() => platformBroadcasts.id, { onDelete: "cascade" }),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),
  },
  (t) => [primaryKey({ columns: [t.broadcastId, t.collegeId] })],
);
