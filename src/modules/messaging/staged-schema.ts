/** Proposed outbound batch receipts. NOT imported by src/db/schema/index.ts until migration approval. */
import {pgTable,uuid,varchar,integer,timestamp,uniqueIndex,index} from "drizzle-orm/pg-core";
export const messagingDeliveryBatches=pgTable("messaging_delivery_batches",{
 id:uuid("id").primaryKey(),
 organizationId:uuid("organization_id").notNull(),
 collegeId:uuid("college_id").notNull(),
 actorUserId:uuid("actor_user_id").notNull(),
 purpose:varchar("purpose",{length:160}).notNull(),
 total:integer("total").notNull(),
 queued:integer("queued").notNull().default(0),
 sent:integer("sent").notNull().default(0),
 failed:integer("failed").notNull().default(0),
 suppressed:integer("suppressed").notNull().default(0),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
 finalizedAt:timestamp("finalized_at",{withTimezone:true}),
},t=>[index("messaging_batches_scope_idx").on(t.collegeId,t.createdAt)]);
export const messagingDeliveryReceipts=pgTable("messaging_delivery_receipts",{
 id:uuid("id").primaryKey(),
 batchId:uuid("batch_id").notNull(),
 /** Tenant-keyed HMAC only, never raw email or phone or a globally linkable digest. */
 recipientKey:varchar("recipient_key",{length:64}).notNull(),
 channel:varchar("channel",{length:16}).notNull(),
 templateKey:varchar("template_key",{length:160}).notNull(),
 purpose:varchar("purpose",{length:160}).notNull(),
 status:varchar("status",{length:16}).notNull(),
 reason:varchar("reason",{length:64}),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
 updatedAt:timestamp("updated_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[
 uniqueIndex("messaging_receipts_batch_recipient_uq").on(t.batchId,t.recipientKey,t.channel,t.templateKey,t.purpose),
 index("messaging_receipts_batch_idx").on(t.batchId,t.status),
]);
