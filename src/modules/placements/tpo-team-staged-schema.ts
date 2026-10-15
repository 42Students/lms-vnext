/** Internal TPO conversations: proposal only; not exported by the registered DB schema. */
import {pgTable,uuid,text,varchar,timestamp,index,uniqueIndex} from "drizzle-orm/pg-core";
import {colleges} from "@/db/schema/colleges";
import {collegeMemberships} from "@/db/schema/memberships";
export const tpoInternalThreads=pgTable("placement_tpo_internal_threads",{
 id:uuid("id").defaultRandom().primaryKey(),
 collegeId:uuid("college_id").notNull().references(()=>colleges.id),
 startedByMembershipId:uuid("started_by_membership_id").notNull().references(()=>collegeMemberships.id),
 invitedMembershipId:uuid("invited_membership_id").notNull().references(()=>collegeMemberships.id),
 topic:varchar("topic",{length:160}).notNull(),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[index("tpo_internal_threads_college_idx").on(t.collegeId,t.createdAt)]);
export const tpoInternalMessages=pgTable("placement_tpo_internal_messages",{
 id:uuid("id").defaultRandom().primaryKey(),
 threadId:uuid("thread_id").notNull().references(()=>tpoInternalThreads.id),
 authorMembershipId:uuid("author_membership_id").notNull().references(()=>collegeMemberships.id),
 body:text("body").notNull(),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[index("tpo_internal_messages_thread_idx").on(t.threadId,t.createdAt)]);
