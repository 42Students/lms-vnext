import {sql} from "drizzle-orm";
import {boolean,check,foreignKey,index,pgTable,text,timestamp,uniqueIndex,uuid,varchar} from "drizzle-orm/pg-core";
import {colleges} from "./colleges";
import {collegeMemberships} from "./memberships";
import {sectionScheduleEvents} from "./academics";
import {activityEvents} from "./activity";
import {users} from "./users";

/** COL-attendance-R02: only verified opt-in guardian contacts receive
 * attendance messages. No learner alternate-phone fallback is permitted. */
export const attendanceParentContacts=pgTable("attendance_parent_contacts",{
 membershipId:uuid("membership_id").primaryKey(),
 collegeId:uuid("college_id").notNull().references(()=>colleges.id,{onDelete:"restrict"}),
 phoneE164:varchar("phone_e164",{length:20}).notNull(),
 smsOptIn:boolean("sms_opt_in").notNull().default(false),
 consentEvidenceReference:text("consent_evidence_reference"),
 consentAt:timestamp("consent_at",{withTimezone:true}),
 verifiedAt:timestamp("verified_at",{withTimezone:true}),
 verifiedByUserId:uuid("verified_by_user_id").references(()=>users.id,{onDelete:"restrict"}),
 updatedAt:timestamp("updated_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[
 foreignKey({name:"attendance_parent_contact_member_college_fk",columns:[t.membershipId,t.collegeId],
  foreignColumns:[collegeMemberships.id,collegeMemberships.collegeId]}).onDelete("restrict"),
 check("attendance_parent_contacts_phone_e164_check",sql`${t.phoneE164} ~ '^\\+[1-9][0-9]{7,14}$'`),
 check("attendance_parent_contact_consent_ck",sql`(
  (${t.smsOptIn}=false) or
  (${t.consentAt} is not null and ${t.verifiedAt} is not null and
   ${t.verifiedByUserId} is not null and length(trim(${t.consentEvidenceReference})) between 8 and 200)
 )`),
]);
/** Durable event-specific pending SMS record, not a fake delivered receipt. */
export const attendanceParentSmsOutbox=pgTable("attendance_parent_sms_outbox",{
 id:uuid("id").defaultRandom().primaryKey(),
 eventId:uuid("event_id").notNull().references(()=>activityEvents.id,{onDelete:"restrict"}),
 collegeId:uuid("college_id").notNull().references(()=>colleges.id,{onDelete:"restrict"}),
 membershipId:uuid("membership_id").notNull(),
 scheduleEventId:uuid("schedule_event_id").notNull().references(()=>sectionScheduleEvents.id,{onDelete:"restrict"}),
 kind:varchar("kind",{length:16}).notNull(),
 courseName:text("course_name").notNull(),
 startsAt:timestamp("starts_at",{withTimezone:true}).notNull(),
 endsAt:timestamp("ends_at",{withTimezone:true}).notNull(),
 status:varchar("status",{length:24}).notNull().default("QUEUED"),
 attemptedAt:timestamp("attempted_at",{withTimezone:true}),
 acceptedAt:timestamp("accepted_at",{withTimezone:true}),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[
 foreignKey({name:"attendance_parent_sms_member_college_fk",columns:[t.membershipId,t.collegeId],
  foreignColumns:[collegeMemberships.id,collegeMemberships.collegeId]}).onDelete("restrict"),
 uniqueIndex("attendance_parent_sms_event_unique").on(t.eventId),
 index("attendance_parent_sms_queue_idx").on(t.status,t.createdAt),
 check("attendance_parent_sms_outbox_kind_check",sql`${t.kind} in ('ABSENT','CORRECTED')`),
 check("attendance_parent_sms_outbox_status_check",sql`${t.status} in ('QUEUED','ATTEMPTED','ACCEPTED','SKIPPED')`),
]);
