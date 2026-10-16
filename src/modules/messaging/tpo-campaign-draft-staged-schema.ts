/** STAGED TPO-campaigns-public-01. No runtime import until migration registered. */
import {sql} from "drizzle-orm";
import {check,foreignKey,jsonb,pgTable,text,timestamp,uuid,varchar} from "drizzle-orm/pg-core";
import {colleges,placementTpoEmailCampaigns,users} from "@/db/schema";
export const stagedTpoCampaignDrafts=pgTable("placement_tpo_campaign_drafts",{
 campaignId:uuid("campaign_id").primaryKey(),
 collegeId:uuid("college_id").notNull().references(()=>colleges.id,{onDelete:"restrict"}),
 title:varchar("title",{length:160}).notNull(),
 subject:varchar("subject",{length:200}).notNull(),
 body:text("body").notNull(),
 senderName:varchar("sender_name",{length:200}).notNull(),
 suppressedCounts:jsonb("suppressed_counts").$type<Record<string,number>>().notNull(),
 templateKey:varchar("template_key",{length:160}).notNull(),
 segment:varchar("segment",{length:24}).notNull(),
 createdByUserId:uuid("created_by_user_id").notNull().references(()=>users.id,{onDelete:"restrict"}),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[
 foreignKey({name:"tpo_campaign_draft_campaign_scope_fk",columns:[t.collegeId,t.campaignId],
  foreignColumns:[placementTpoEmailCampaigns.collegeId,placementTpoEmailCampaigns.id]}).onDelete("restrict"),
 check("tpo_campaign_draft_segment_ck",sql`${t.segment} IN ('ALL_ELIGIBLE','NEW','UNASSIGNED')`),
 check("tpo_campaign_draft_body_ck",sql`length(trim(${t.body})) BETWEEN 2 AND 4000`),
]);
