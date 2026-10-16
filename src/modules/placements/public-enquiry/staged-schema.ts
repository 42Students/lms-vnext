/** TPO-campaigns-public-31: staged, never imported by runtime. */
import { sql } from "drizzle-orm";
import { check,index,pgTable,timestamp,uuid,varchar } from "drizzle-orm/pg-core";
import { colleges } from "@/db/schema";
export const stagedPublicEnquiryNetworkRates=pgTable("placement_public_enquiry_rate_events",{
 id:uuid("id").defaultRandom().primaryKey(),
 collegeId:uuid("college_id").notNull().references(()=>colleges.id,{onDelete:"restrict"}),
 ipHash:varchar("ip_hash",{length:64}).notNull(),
 action:varchar("action",{length:12}).notNull(),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[
 index("public_enquiry_rate_ip_action_idx").on(t.ipHash,t.action,t.createdAt.desc()),
 check("public_enquiry_rate_ip_ck",sql`${t.ipHash} ~ '^[a-f0-9]{64}$'`),
 check("public_enquiry_rate_action_ck",sql`${t.action} in ('SEND_CODE','RECRUIT')`),
]);
