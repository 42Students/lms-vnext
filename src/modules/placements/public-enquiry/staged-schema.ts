/** Proposed schema only, not active until migration registration. */
import { index, integer, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
export const publicRecruitEnquiryChallenges=pgTable("placement_public_enquiry_challenges",{
  id:uuid("id").defaultRandom().primaryKey(),
  collegeId:uuid("college_id").notNull(),
  workEmail:varchar("work_email",{length:254}).notNull(),
  codeHash:varchar("code_hash",{length:64}).notNull(),
  attempts:integer("attempts").notNull().default(0),
  expiresAt:timestamp("expires_at",{withTimezone:true}).notNull(),
  verifiedAt:timestamp("verified_at",{withTimezone:true}),
  requestedAt:timestamp("requested_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[index("public_enquiry_challenges_email_idx").on(t.collegeId,t.workEmail,t.requestedAt)]);
export const publicRecruitEnquiries=pgTable("placement_public_recruit_enquiries",{
  id:uuid("id").defaultRandom().primaryKey(),
  collegeId:uuid("college_id").notNull(),
  challengeId:uuid("challenge_id").notNull(),
  fullName:varchar("full_name",{length:120}).notNull(),
  companyName:varchar("company_name",{length:160}).notNull(),
  message:text("message").notNull(),
  createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[uniqueIndex("public_enquiry_challenge_unique").on(t.challengeId),
  index("public_enquiry_college_created_idx").on(t.collegeId,t.createdAt)]);
