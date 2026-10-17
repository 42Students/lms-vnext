/** PROPOSED migration: docs/proposed-migrations/tpo-company-team-conversations.sql.
 * One whole-placement-team discussion per college company relationship.
 */
import {sql} from "drizzle-orm";
import {check,foreignKey,index,pgTable,text,timestamp,uniqueIndex,uuid,varchar} from "drizzle-orm/pg-core";
import {colleges} from "./colleges";
import {collegeMemberships} from "./memberships";
import {placementCompanyRelationships} from "./placements";

export const placementTpoCompanyThreads=pgTable("placement_tpo_company_threads",{
 id:uuid("id").defaultRandom().primaryKey(),
 collegeId:uuid("college_id").notNull().references(()=>colleges.id,{onDelete:"restrict"}),
 relationshipId:uuid("relationship_id").notNull(),
 createdByMembershipId:uuid("created_by_membership_id").notNull(),
 topic:varchar("topic",{length:200}).notNull(),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[
 foreignKey({name:"tpo_company_threads_college_relationship_fk",
  columns:[t.relationshipId,t.collegeId],
  foreignColumns:[placementCompanyRelationships.id,placementCompanyRelationships.collegeId]}).onDelete("restrict"),
 foreignKey({name:"tpo_company_threads_college_creator_fk",
  columns:[t.createdByMembershipId,t.collegeId],
  foreignColumns:[collegeMemberships.id,collegeMemberships.collegeId]}).onDelete("restrict"),
 uniqueIndex("tpo_company_threads_one_per_relationship_uq").on(t.collegeId,t.relationshipId),
 uniqueIndex("tpo_company_threads_id_college_uq").on(t.id,t.collegeId),
 index("tpo_company_threads_college_created_idx").on(t.collegeId,t.createdAt),
 check("tpo_company_threads_topic_ck",sql`length(btrim(${t.topic})) between 1 and 200`),
]);

export const placementTpoCompanyThreadMessages=pgTable("placement_tpo_company_thread_messages",{
 id:uuid("id").defaultRandom().primaryKey(),
 threadId:uuid("thread_id").notNull(),
 collegeId:uuid("college_id").notNull(),
 authorMembershipId:uuid("author_membership_id").notNull(),
 body:text("body").notNull(),
 idempotencyKey:uuid("idempotency_key").notNull(),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[
 foreignKey({name:"tpo_company_message_thread_college_fk",
  columns:[t.threadId,t.collegeId],
  foreignColumns:[placementTpoCompanyThreads.id,placementTpoCompanyThreads.collegeId]}).onDelete("restrict"),
 foreignKey({name:"tpo_company_message_author_college_fk",
  columns:[t.authorMembershipId,t.collegeId],
  foreignColumns:[collegeMemberships.id,collegeMemberships.collegeId]}).onDelete("restrict"),
 uniqueIndex("tpo_company_message_dedupe_uq").on(t.threadId,t.authorMembershipId,t.idempotencyKey),
 index("tpo_company_message_thread_history_idx").on(t.threadId,t.createdAt,t.id),
 check("tpo_company_message_body_ck",sql`length(btrim(${t.body})) between 1 and 4000`),
]);
