/** Typed placement requests for learner circumstances not tied to an LMS job application.
 * Proposal SQL requires orchestrator registration before route runtime use. */
import {sql} from "drizzle-orm";
import {check,foreignKey,index,jsonb,pgTable,text,timestamp,uniqueIndex,uuid,varchar} from "drizzle-orm/pg-core";
import {colleges} from "./colleges";
import {collegeMemberships} from "./memberships";
import {users} from "./users";
export const placementLearnerGeneralRequests=pgTable("placement_learner_general_requests",{
 id:uuid("id").defaultRandom().primaryKey(),
 collegeId:uuid("college_id").notNull().references(()=>colleges.id,{onDelete:"restrict"}),
 membershipId:uuid("membership_id").notNull(),
 kind:varchar("kind",{length:40}).notNull(),
 targetKey:varchar("target_key",{length:150}).notNull(),
 reason:text("reason").notNull(),
 payload:jsonb("payload").$type<Record<string,unknown>>().notNull(),
 status:varchar("status",{length:20}).notNull().default("PENDING"),
 requestedByUserId:uuid("requested_by_user_id").notNull().references(()=>users.id,{onDelete:"restrict"}),
 requestedAt:timestamp("requested_at",{withTimezone:true}).notNull().defaultNow(),
 decidedByUserId:uuid("decided_by_user_id").references(()=>users.id,{onDelete:"restrict"}),
 decidedAt:timestamp("decided_at",{withTimezone:true}),
 decisionNote:text("decision_note"),
 version:uuid("version").defaultRandom().notNull(),
 updatedAt:timestamp("updated_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[
 foreignKey({name:"placement_general_request_member_college_fk",columns:[t.membershipId,t.collegeId],
  foreignColumns:[collegeMemberships.id,collegeMemberships.collegeId]}).onDelete("restrict"),
 uniqueIndex("placement_general_request_one_pending_target_uq").on(t.membershipId,t.kind,t.targetKey)
  .where(sql`${t.status}='PENDING'`),
 index("placement_general_request_college_queue_idx").on(t.collegeId,t.status,t.requestedAt),
 index("placement_general_request_member_idx").on(t.collegeId,t.membershipId,t.requestedAt),
 check("placement_general_request_kind_ck",sql`${t.kind} in ('OFF_CAMPUS_OFFER','REGISTRATION_CHANGE','ABSENCE_DISPUTE','CORRECTION_WITH_PROOF','PLACEMENT_AFTER_PLACEMENT')`),
 check("placement_general_request_status_ck",sql`${t.status} in ('PENDING','APPROVED','REJECTED','CANCELLED')`),
 check("placement_general_request_reason_ck",sql`length(btrim(${t.reason})) between 3 and 2000`),
 check("placement_general_request_payload_ck",sql`jsonb_typeof(${t.payload})='object'`),
 check("placement_general_request_decision_ck",sql`(${t.status}='PENDING' and ${t.decidedByUserId} is null and ${t.decidedAt} is null) or
  (${t.status}<>'PENDING' and ${t.decidedByUserId} is not null and ${t.decidedAt} is not null)`),
]);
export const placementLearnerGeneralRequestEvents=pgTable("placement_learner_general_request_events",{
 id:uuid("id").defaultRandom().primaryKey(),
 requestId:uuid("request_id").notNull().references(()=>placementLearnerGeneralRequests.id,{onDelete:"restrict"}),
 priorStatus:varchar("prior_status",{length:20}),
 nextStatus:varchar("next_status",{length:20}).notNull(),
 actorUserId:uuid("actor_user_id").notNull().references(()=>users.id,{onDelete:"restrict"}),
 note:text("note"),
 occurredAt:timestamp("occurred_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[index("placement_general_request_events_parent_idx").on(t.requestId,t.occurredAt),
 check("placement_general_request_events_status_ck",sql`${t.nextStatus} in ('PENDING','APPROVED','REJECTED','CANCELLED')`)]);
