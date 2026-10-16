/** TPO-inbox-team-43: frozen recipients of targeted TPO notices (scoped to one college by trigger). */
import { pgTable, primaryKey, uuid, varchar, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { db10Announcements } from "./db10-announcements";
import { collegeMemberships } from "./memberships";

export const placementTpoNoticeAudiences = pgTable(
  "placement_tpo_notice_audiences",
  {
    announcementId: uuid("announcement_id")
      .primaryKey()
      .references(() => db10Announcements.id, { onDelete: "restrict" }),
    kind: varchar("kind", { length: 24 }).notNull(),
  },
  (t) => [
    check(
      "tpo_notice_audience_kind_ck",
      sql`${t.kind} IN ('COLLEGE','PLACEMENTS','BATCHES','BRANCHES','DRIVE')`,
    ),
  ],
);

export const placementTpoNoticeRecipients = pgTable(
  "placement_tpo_notice_recipients",
  {
    announcementId: uuid("announcement_id")
      .notNull()
      .references(() => db10Announcements.id, { onDelete: "restrict" }),
    membershipId: uuid("membership_id")
      .notNull()
      .references(() => collegeMemberships.id, { onDelete: "restrict" }),
  },
  (t) => [primaryKey({ columns: [t.announcementId, t.membershipId] })],
);
