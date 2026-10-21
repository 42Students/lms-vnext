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
    index("course_discussion_messages_live_cursor_idx")
      .on(table.deliveryId,table.createdAt,table.id)
      .where(sql`${table.deletedAt} is null`),
    index("course_discussion_messages_live_pin_idx")
      .on(table.deliveryId,table.createdAt)
      .where(sql`${table.deletedAt} is null and ${table.pinned}=true`),
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

/** Old discussion IDs are Java Long; values outside JS safe integers must
 * remain decimal strings until explicitly mapped to a same-college UUID.
 * No historic messages are imported by the greenfield launch. */
export const LEGACY_COURSE_DISCUSSION_TEXT_LIMIT=4000;
export function normalizeLegacyDiscussionId(raw:unknown):string{
 const text=typeof raw==="bigint"?raw.toString():
  typeof raw==="string"?raw.trim():"";
 if(!/^[1-9][0-9]*$/.test(text)||text.length>19)
  throw new Error("Invalid legacy discussion ID");
 return text;
}
export function legacyDiscussionSenderMapping(input:{
 legacySenderId:string|bigint;role:string;
 membershipId:string;membershipCollegeId:string;deliveryCollegeId:string;
}):{legacySenderId:string;senderRole:"FACULTY"|"LEARNER"|"ADMIN";senderMembershipId:string}{
 if(input.membershipCollegeId!==input.deliveryCollegeId)
  throw new Error("Discussion sender and classroom college must match");
 const mappedRole=input.role.toUpperCase();
 if(mappedRole!=="LEARNER"&&mappedRole!=="FACULTY"&&mappedRole!=="ADMIN")
  throw new Error("Legacy discussion sender type requires manual role mapping");
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.membershipId))
  throw new Error("Verified sender membership UUID required");
 return {legacySenderId:normalizeLegacyDiscussionId(input.legacySenderId),
  senderRole:mappedRole,senderMembershipId:input.membershipId};
}
/** Learner/faculty UI shows the same persisted 1–4000-character posting
 * limit as the DB check. Sequence is (created_at,id), newest page first and
 * reversed for chronological display; a pin is loaded independently. */
export const LEGACY_DISCUSSION_FEED_ORDER=["created_at","id"] as const;
