/**
 * DB04 normalized education/profile-image persistence — STAGED ONLY.
 *
 * Do not export from db/schema/index.ts and do not generate a migration from
 * this file until W01 reconciles the DB04 receipt parent keys and migration
 * order. This preserves active legacy qualification + student_image semantics
 * without making an unverified runtime claim.
 */
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { collegeMemberships } from "./memberships";
import { profilePrivateDocumentReceipts } from "./profile-verification";

export const learnerProfileEducationEntries = pgTable(
  "learner_profile_education_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    learnerMembershipId: uuid("learner_membership_id")
      .notNull()
      .references(() => collegeMemberships.id, { onDelete: "restrict" }),
    educationType: varchar("education_type", { length: 120 }).notNull(),
    program: varchar("program", { length: 200 }),
    specialization: varchar("specialization", { length: 200 }),
    institutionName: varchar("institution_name", { length: 300 }).notNull(),
    startYear: integer("start_year"),
    endYear: integer("end_year"),
    isCurrentlyPursuing: boolean("is_currently_pursuing")
      .notNull()
      .default(false),
    gradingType: varchar("grading_type", { length: 32 }).notNull(),
    gradeObtained: varchar("grade_obtained", { length: 64 }).notNull(),
    maxGrade: varchar("max_grade", { length: 64 }).notNull(),
    isRecentEducation: boolean("is_recent_education")
      .notNull()
      .default(false),
    qualifyingExam: varchar("qualifying_exam", { length: 120 }),
    examRank: varchar("exam_rank", { length: 200 }),
    examDetails: jsonb("exam_details").notNull().default(sql`'{}'::jsonb`),

    // Compatibility-only fields. API parity may explicitly retire these later,
    // but source-compatible writes must not silently discard them meanwhile.
    legacyDegree: varchar("legacy_degree", { length: 100 }),
    legacyField: varchar("legacy_field", { length: 100 }),
    legacyScore: varchar("legacy_score", { length: 100 }),
    legacyDescription: text("legacy_description"),
    /** Source-only provenance: never treat a historical upload URL as an authorized file. */
    legacyQualificationId: integer("legacy_qualification_id"),
    legacyCertificateUpload: text("legacy_certificate_upload"),
    legacyStartYearRaw: varchar("legacy_start_year_raw", { length: 32 }),
    legacyEndYearRaw: varchar("legacy_end_year_raw", { length: 32 }),
    legacyWasDeleted: boolean("legacy_was_deleted"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("learner_profile_education_id_owner_uq").on(
      table.id,
      table.learnerMembershipId,
    ),
    uniqueIndex("learner_profile_education_recent_uq")
      .on(table.learnerMembershipId)
      .where(
        sql`${table.archivedAt} is null and ${table.isRecentEducation} = true`,
      ),
    index("learner_profile_education_legacy_source_idx")
      .on(table.learnerMembershipId, table.legacyQualificationId)
      .where(sql`${table.legacyQualificationId} is not null`),
    index("learner_profile_education_active_idx").on(
      table.learnerMembershipId,
      table.archivedAt,
    ),
    index("learner_profile_education_screening_idx")
      .on(
        table.learnerMembershipId,
        table.program,
        table.specialization,
        table.gradingType,
        table.endYear,
      )
      .where(sql`${table.archivedAt} is null`),
    check(
      "learner_profile_education_type_ck",
      sql`char_length(trim(${table.educationType})) > 0`,
    ),
    check(
      "learner_profile_education_institution_ck",
      sql`char_length(trim(${table.institutionName})) > 0`,
    ),
    check(
      "learner_profile_education_grading_ck",
      sql`${table.gradingType} in ('CGPA','GPA','Percentage','Grade')`,
    ),
    check(
      "learner_profile_education_grade_ck",
      sql`char_length(trim(${table.gradeObtained})) > 0
        and char_length(trim(${table.maxGrade})) > 0`,
    ),
    check(
      "learner_profile_education_start_year_ck",
      sql`${table.startYear} is null or ${table.startYear} between 1900 and 2200`,
    ),
    check(
      "learner_profile_education_end_year_ck",
      sql`${table.endYear} is null or ${table.endYear} between 1900 and 2200`,
    ),
    check(
      "learner_profile_education_year_order_ck",
      sql`${table.startYear} is null
        or ${table.endYear} is null
        or ${table.endYear} >= ${table.startYear}`,
    ),
    check(
      "learner_profile_education_pursuing_ck",
      sql`not ${table.isCurrentlyPursuing} or ${table.endYear} is null`,
    ),
    check(
      "learner_profile_education_exam_details_ck",
      sql`jsonb_typeof(${table.examDetails}) = 'object'`,
    ),
  ],
);

export const learnerProfileEducationDocuments = pgTable(
  "learner_profile_education_documents",
  {
    educationEntryId: uuid("education_entry_id").notNull(),
    learnerMembershipId: uuid("learner_membership_id").notNull(),
    receiptId: uuid("receipt_id").notNull(),
    purpose: varchar("purpose", { length: 32 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({
      name: "learner_profile_education_documents_pk",
      columns: [table.educationEntryId, table.receiptId],
    }),
    foreignKey({
      name: "learner_profile_education_documents_education_fk",
      columns: [table.educationEntryId, table.learnerMembershipId],
      foreignColumns: [
        learnerProfileEducationEntries.id,
        learnerProfileEducationEntries.learnerMembershipId,
      ],
    }).onDelete("restrict"),
    // W01 must promote the matching unique parent key
    // (id, owning_membership_id, purpose) on profile_private_document_receipts
    // before this FK can be registered.
    foreignKey({
      name: "learner_profile_education_documents_receipt_fk",
      columns: [table.receiptId, table.learnerMembershipId, table.purpose],
      foreignColumns: [
        profilePrivateDocumentReceipts.id,
        profilePrivateDocumentReceipts.owningMembershipId,
        profilePrivateDocumentReceipts.purpose,
      ],
    }).onDelete("restrict"),
    index("learner_profile_education_documents_owner_idx").on(
      table.learnerMembershipId,
      table.educationEntryId,
    ),
    check(
      "learner_profile_education_documents_purpose_ck",
      sql`${table.purpose} in ('MARKSHEET','EDUCATION_CERTIFICATE')`,
    ),
  ],
);

export const learnerProfileImages = pgTable(
  "learner_profile_images",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    learnerMembershipId: uuid("learner_membership_id")
      .notNull()
      .references(() => collegeMemberships.id, { onDelete: "restrict" }),
    receiptId: uuid("receipt_id").notNull(),
    receiptPurpose: varchar("receipt_purpose", { length: 32 })
      .notNull()
      .default("PROFILE_IMAGE"),
    displayOrder: integer("display_order").notNull().default(0),
    /** Historical image identity/URL is a quarantined source snapshot, not a signed URL. */
    legacyImageId: integer("legacy_image_id"),
    legacyImageUrl: text("legacy_image_url"),
    legacyWasDeleted: boolean("legacy_was_deleted"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    deactivatedAt: timestamp("deactivated_at", { withTimezone: true }),
  },
  (table) => [
    foreignKey({
      name: "learner_profile_images_receipt_fk",
      columns: [
        table.receiptId,
        table.learnerMembershipId,
        table.receiptPurpose,
      ],
      foreignColumns: [
        profilePrivateDocumentReceipts.id,
        profilePrivateDocumentReceipts.owningMembershipId,
        profilePrivateDocumentReceipts.purpose,
      ],
    }).onDelete("restrict"),
    uniqueIndex("learner_profile_images_owner_receipt_uq").on(
      table.learnerMembershipId,
      table.receiptId,
    ),
    index("learner_profile_images_legacy_source_idx")
      .on(table.learnerMembershipId, table.legacyImageId)
      .where(sql`${table.legacyImageId} is not null`),
    index("learner_profile_images_active_order_idx")
      .on(table.learnerMembershipId, table.displayOrder)
      .where(sql`${table.isActive} = true`),
    check(
      "learner_profile_images_receipt_purpose_ck",
      sql`${table.receiptPurpose} = 'PROFILE_IMAGE'`,
    ),
    check(
      "learner_profile_images_order_ck",
      sql`${table.displayOrder} >= 0`,
    ),
    check(
      "learner_profile_images_active_ck",
      sql`(${table.isActive} = true and ${table.deactivatedAt} is null)
        or (${table.isActive} = false and ${table.deactivatedAt} is not null)`,
    ),
  ],
);
