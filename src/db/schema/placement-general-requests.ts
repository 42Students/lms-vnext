import {sql} from "drizzle-orm";
import {check,index,jsonb,pgTable,text,timestamp,uniqueIndex,uuid,varchar} from "drizzle-orm/pg-core";
import {colleges} from "./colleges";
import {collegeMemberships} from "./memberships";
import {users} from "./users";

/** Proposed learner-to-TPO request taxonomy; register migration before enabling writes. */
export const placementLearnerGeneralRequests=pgTable("placement_learner_general_requests",{
 id:uuid("id").defaultRandom().primaryKey(),
 collegeId:uuid("college_id").notNull().references(()=>colleges.id,{onDelete:"restrict"}),
 membershipId:uuid("membership_id").notNull().references(()=>collegeMemberships.id,{onDelete:"restrict"}),
 kind:varchar("kind",{length:40}).notNull(),
 targetKey:text("target_key").notNull(),
 status:varchar("status",{length:16}).notNull().default("PENDING"),
 reason:text("reason").notNull(),
 payload:jsonb("payload").$type<Record<string,unknown>>().notNull().default(sql`'{}'::jsonb`),
 requestedByUserId:uuid("requested_by_user_id").notNull().references(()=>users.id,{onDelete:"restrict"}),
 requestedAt:timestamp("requested_at",{withTimezone:true}).notNull().defaultNow(),
 version:uuid("version").notNull().defaultRandom(),
 updatedAt:timestamp("updated_at",{withTimezone:true}).notNull().defaultNow(),
 decidedByUserId:uuid("decided_by_user_id").references(()=>users.id,{onDelete:"restrict"}),
 decidedAt:timestamp("decided_at",{withTimezone:true}),
 decisionNote:text("decision_note"),
},t=>[
 uniqueIndex("placement_learner_general_pending_target_uq").on(t.collegeId,t.membershipId,t.kind,t.targetKey)
  .where(sql`${t.status} = 'PENDING'`),
 index("placement_learner_general_college_status_idx").on(t.collegeId,t.status,t.requestedAt),
 index("placement_learner_general_member_idx").on(t.collegeId,t.membershipId,t.requestedAt),
 check("placement_learner_general_kind_ck",sql`${t.kind} in
  ('OFF_CAMPUS_OFFER','REGISTRATION_CHANGE','ABSENCE_DISPUTE','CORRECTION_WITH_PROOF','PLACEMENT_AFTER_PLACEMENT')`),
 check("placement_learner_general_status_ck",sql`${t.status} in ('PENDING','APPROVED','REJECTED','CANCELLED')`),
 check("placement_learner_general_reason_ck",sql`length(trim(${t.reason})) between 3 and 2000`),
]);

export const placementLearnerGeneralRequestEvents=pgTable("placement_learner_general_request_events",{
 id:uuid("id").defaultRandom().primaryKey(),
 requestId:uuid("request_id").notNull().references(()=>placementLearnerGeneralRequests.id,{onDelete:"restrict"}),
 priorStatus:varchar("prior_status",{length:16}),
 nextStatus:varchar("next_status",{length:16}).notNull(),
 actorUserId:uuid("actor_user_id").notNull().references(()=>users.id,{onDelete:"restrict"}),
 note:text("note"),
 occurredAt:timestamp("occurred_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[
 index("placement_learner_general_events_request_idx").on(t.requestId,t.occurredAt),
 check("placement_learner_general_events_status_ck",sql`${t.nextStatus} in ('PENDING','APPROVED','REJECTED','CANCELLED')`),
]);
