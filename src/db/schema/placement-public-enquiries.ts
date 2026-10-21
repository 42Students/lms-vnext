/** Public recruiter enquiries gated by an email-code challenge (college-scoped). */
import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { colleges } from "./colleges";

export const placementPublicEnquiryChallenges = pgTable(
  "placement_public_enquiry_challenges",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),
    workEmail: varchar("work_email", { length: 254 }).notNull(),
    // Source-only; import must resolve the college before any challenge ID.
    legacyChallengeId: integer("legacy_challenge_id"),
    codeHash: varchar("code_hash", { length: 64 }).notNull(),
    attempts: integer("attempts").notNull().default(0),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    requestedAt: timestamp("requested_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("public_enquiry_challenges_id_college_uq").on(table.id, table.collegeId),
    index("public_enquiry_challenges_email_idx").on(table.collegeId, table.workEmail, table.requestedAt.desc()),
    uniqueIndex("public_enquiry_challenges_legacy_college_idx")
      .on(table.collegeId,table.legacyChallengeId)
      .where(sql`${table.legacyChallengeId} is not null`),
    check("placement_public_enquiry_challenges_code_ck", sql`${table.codeHash} ~ '^[a-f0-9]{64}$'`),
    check("placement_public_enquiry_challenges_attempts_ck", sql`${table.attempts} BETWEEN 0 AND 5`),
    check("placement_public_enquiry_challenges_expiry_ck", sql`${table.expiresAt} > ${table.requestedAt}`),
  ],
);

export const placementPublicRecruitEnquiries = pgTable(
  "placement_public_recruit_enquiries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),
    challengeId: uuid("challenge_id").notNull(),
    legacyEnquiryId: integer("legacy_enquiry_id"),
    fullName: varchar("full_name", { length: 120 }).notNull(),
    companyName: varchar("company_name", { length: 160 }).notNull(),
    message: text("message").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("public_enquiry_challenge_unique").on(table.challengeId),
    uniqueIndex("public_enquiry_legacy_college_idx").on(table.collegeId,table.legacyEnquiryId)
      .where(sql`${table.legacyEnquiryId} is not null`),
    index("public_enquiry_college_created_idx").on(table.collegeId, table.createdAt.desc()),
    foreignKey({
      name: "public_enquiry_challenge_college_fk",
      columns: [table.challengeId, table.collegeId],
      foreignColumns: [placementPublicEnquiryChallenges.id, placementPublicEnquiryChallenges.collegeId],
    }).onDelete("restrict"),
    check("placement_public_recruit_enquiries_message_ck", sql`char_length(${table.message}) BETWEEN 10 AND 1500`),
  ],
);
