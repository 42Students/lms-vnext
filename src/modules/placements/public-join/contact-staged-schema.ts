/** STAGED ONLY TPO-campaigns-public-R01. No authentication phone linkage. */
import {sql} from "drizzle-orm";
import {check,pgTable,timestamp,uuid,varchar} from "drizzle-orm/pg-core";
import {users} from "@/db/schema";
export const stagedPublicRecruiterContact=pgTable("placement_recruiter_public_contacts",{
 recruiterUserId:uuid("recruiter_user_id").primaryKey().references(()=>users.id,{onDelete:"restrict"}),
 phoneDigits:varchar("phone_digits",{length:10}).notNull(),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
 updatedAt:timestamp("updated_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[check("public_recruiter_contact_phone_ck",sql`${t.phoneDigits} ~ '^[0-9]{10}$'`)]);
