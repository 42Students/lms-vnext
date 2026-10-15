/** T-S2-04: NOT REGISTERED. No service imports; orchestrator owns migration. */
import {index,integer,pgTable,timestamp,uniqueIndex,uuid,varchar} from "drizzle-orm/pg-core";
export const placementTpoEmailCampaignsStaged=pgTable("placement_tpo_email_campaigns",{
  id:uuid("id").defaultRandom().primaryKey(),
  collegeId:uuid("college_id").notNull(),
  createdByUserId:uuid("created_by_user_id").notNull(),
  status:varchar("status",{length:16}).notNull().default("DRAFT"),
  totalRecipients:integer("total_recipients").notNull().default(0),
  createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[
  uniqueIndex("tpo_email_campaign_college_id_uq").on(t.collegeId,t.id),
  index("tpo_email_campaign_college_created_idx").on(t.collegeId,t.createdAt),
]);
export const placementTpoEmailRecipientsStaged=pgTable("placement_tpo_email_campaign_recipients",{
  id:uuid("id").defaultRandom().primaryKey(),
  collegeId:uuid("college_id").notNull(),
  campaignId:uuid("campaign_id").notNull(),
  leadId:uuid("lead_id").notNull(),
  recipientKey:varchar("recipient_key",{length:64}).notNull(),
  status:varchar("status",{length:24}).notNull().default("PENDING"),
  unsubscribedAt:timestamp("unsubscribed_at",{withTimezone:true}),
  sentAt:timestamp("sent_at",{withTimezone:true}),
  createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[
  uniqueIndex("tpo_email_recipient_campaign_lead_uq").on(t.campaignId,t.leadId),
  index("tpo_email_recipient_college_campaign_idx").on(t.collegeId,t.campaignId),
]);
