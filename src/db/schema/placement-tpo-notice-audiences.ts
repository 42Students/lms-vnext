/**
 * TPO-inbox-team-43: frozen recipients of targeted TPO notices (scoped to one
 * college by trigger). Legacy numeric studentId identifies a learner account;
 * vNext membershipId identifies that learner's membership in this college.
 * Never map numeric studentId directly to a users.id or use a cross-college
 * membership. Direct receipts are separate from user notification read state;
 * mark-read must use the authenticated learner membership and resolved TPO
 * announcement audience, never mark every membership for the same user read.
 * A historic read flag cannot be inferred without receipt timestamp evidence.
 */
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
