import {pgTable,uuid,varchar,text,boolean,timestamp,integer,primaryKey,index} from "drizzle-orm/pg-core";
/** Proposed platform announcements only. No runtime use until owner migration. */
export const platformBroadcastsStaged=pgTable("platform_broadcasts",{
 id:uuid("id").primaryKey(),
 title:varchar("title",{length:255}).notNull(),
 message:text("message").notNull(),
 linkUrl:varchar("link_url",{length:2048}),
 isPinned:boolean("is_pinned").notNull().default(false),
 showUntil:timestamp("show_until",{withTimezone:true}).notNull(),
 audienceMode:varchar("audience_mode",{length:24}).notNull(),
 status:varchar("status",{length:16}).notNull(),
 authorUserId:uuid("author_user_id").notNull(),
 version:integer("version").notNull().default(0),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull(),
},table=>[index("platform_broadcasts_created_at").on(table.createdAt)]);
export const platformBroadcastTargetsStaged=pgTable("platform_broadcast_targets",{
 broadcastId:uuid("broadcast_id").notNull(),
 collegeId:uuid("college_id").notNull(),
},table=>[primaryKey({columns:[table.broadcastId,table.collegeId]})]);
