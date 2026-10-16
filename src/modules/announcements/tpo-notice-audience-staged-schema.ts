/** STAGED only: TPO-inbox-team-43. Not an active schema barrel export. */
import {pgTable,primaryKey,uuid,varchar} from "drizzle-orm/pg-core";
import {db10Announcements} from "@/db/schema/db10-announcements";
import {collegeMemberships} from "@/db/schema/memberships";
export const stagedTpoNoticeAudience=pgTable("placement_tpo_notice_audiences",{
 announcementId:uuid("announcement_id").primaryKey()
  .references(()=>db10Announcements.id,{onDelete:"restrict"}),
 kind:varchar("kind",{length:24}).notNull(),
});
export const stagedTpoNoticeRecipient=pgTable("placement_tpo_notice_recipients",{
 announcementId:uuid("announcement_id").notNull()
  .references(()=>db10Announcements.id,{onDelete:"restrict"}),
 membershipId:uuid("membership_id").notNull()
  .references(()=>collegeMemberships.id,{onDelete:"restrict"}),
},t=>[primaryKey({columns:[t.announcementId,t.membershipId]})]);
