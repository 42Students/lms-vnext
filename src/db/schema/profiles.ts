import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  jsonb,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { collegeMemberships } from "./memberships";
import { departments } from "./departments";
import { cohorts } from "./academics";

export const learnerProfiles = pgTable("learner_profiles", {
  membershipId: uuid("membership_id")
    .primaryKey()
    .references(() => collegeMemberships.id, { onDelete: "restrict" }),
  rollNumber: varchar("roll_number", { length: 128 }),
  legacyLearnerId: integer("legacy_learner_id"),
  /** Historic batch membership is import provenance, not current enrollment. */
  legacyBatchId: integer("legacy_batch_id"),
  importedCohortId: uuid("imported_cohort_id").references(()=>cohorts.id,{onDelete:"restrict"}),
  /** Only private key is stored; signed URL is created per-authorized request. */
  avatarObjectPath: varchar("avatar_object_path",{length:1024}),
  /** Legacy student uniqueId is distinct from roll and auth identityUid. */
  legacyUniqueId: varchar("legacy_unique_id", { length: 128 }),
  registrationNumber: varchar("registration_number", { length: 128 }),
  /** Private storage key, never an expired signed URL or a client-supplied path. */
  resumeObjectPath: varchar("resume_object_path", { length: 1024 }),
  resumeScanStatus: varchar("resume_scan_status",{length:16}),
  resumeVerifiedAt: timestamp("resume_verified_at",{withTimezone:true}),
  /** Independent compare-and-swap revision for learner document updates. */
  profileDocumentVersion: integer("profile_document_version").notNull().default(0),
  profileDocument: jsonb("profile_document")
    .$type<Record<string, unknown>>()
    .notNull()
    .default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (t) => [
  check("learner_profiles_document_version_ck", sql`${t.profileDocumentVersion} >= 0`),
  index("learner_profiles_import_batch_idx").on(t.legacyBatchId,t.importedCohortId)
    .where(sql`${t.legacyBatchId} is not null`),
  check("learner_profiles_import_batch_pair_ck",sql`
    (${t.legacyBatchId} is null) = (${t.importedCohortId} is null)`),
  index("learner_profiles_legacy_student_idx").on(t.legacyLearnerId)
    .where(sql`${t.legacyLearnerId} is not null`),
  check("learner_profiles_resume_scan_ck",sql`
    ${t.resumeScanStatus} is null or ${t.resumeScanStatus} in ('PENDING','CLEAN','REJECTED')`),
  check("learner_profiles_resume_verified_ck",sql`
    ${t.resumeVerifiedAt} is null or ${t.resumeScanStatus}='CLEAN'`),
]);

export const facultyProfiles = pgTable(
  "faculty_profiles",
  {
    membershipId: uuid("membership_id")
      .primaryKey()
      .references(() => collegeMemberships.id, { onDelete: "restrict" }),
    primaryDepartmentId: uuid("primary_department_id").references(
      () => departments.id,
      { onDelete: "restrict" },
    ),
    legacyFacultyId: integer("legacy_faculty_id"),
    /** Staff code is not a login credential or a membership role. */
    legacyFacultyCode: varchar("legacy_faculty_code", { length: 128 }),
    employmentType: varchar("employment_type", { length: 128 }),
    academicTitle: varchar("academic_title", { length: 128 }),
    /** Faculty photo key is owned and signed at access time by storage service. */
    avatarObjectPath: varchar("avatar_object_path", { length: 1024 }),
    profileDocument: jsonb("profile_document")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    profileDocumentVersion: integer("profile_document_version")
      .notNull()
      .default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("faculty_profiles_legacy_faculty_idx").on(table.legacyFacultyId)
      .where(sql`${table.legacyFacultyId} is not null`),
    index("faculty_profiles_primary_department_idx").on(
      table.primaryDepartmentId,
    ),
    check(
      "faculty_profiles_document_version_nonnegative",
      sql`${table.profileDocumentVersion} >= 0`,
    ),
  ],
);

/** An imported batch association is undone only after comparing its current
 * profile mapping to the audited after-image; live enrollment remains separate.
 * This table has no cascading deletes or implicit learner transfer. */
export const learnerProfileImportUndoJournal=pgTable("learner_profile_import_undo_journal",{
 id:uuid("id").defaultRandom().primaryKey(),
 membershipId:uuid("membership_id").notNull().references(()=>collegeMemberships.id,{onDelete:"restrict"}),
 legacyBatchId:integer("legacy_batch_id").notNull(),
 importedCohortId:uuid("imported_cohort_id").notNull().references(()=>cohorts.id,{onDelete:"restrict"}),
 previousCohortId:uuid("previous_cohort_id").references(()=>cohorts.id,{onDelete:"restrict"}),
 appliedAt:timestamp("applied_at",{withTimezone:true}).notNull().defaultNow(),
 reversedAt:timestamp("reversed_at",{withTimezone:true}),
 referenceCountAtApply:integer("reference_count_at_apply").notNull().default(0),
},t=>[
 index("learner_profile_import_undo_membership_idx").on(t.membershipId,t.appliedAt),
 index("learner_profile_import_undo_batch_idx").on(t.legacyBatchId,t.importedCohortId),
 check("learner_profile_import_undo_reference_ck",sql`${t.referenceCountAtApply}>=0`),
 check("learner_profile_import_undo_reversal_ck",sql`
   ${t.reversedAt} is null or ${t.reversedAt}>=${t.appliedAt}`),
]);
/** The undo handler must additionally check no active program enrollment,
 * placement registration, delivery, assignment or audit row depends on the
 * imported cohort and must compare the profile's current cohort before CAS. */
export function canUndoImportedLearnerBatch(input:{
 currentCohortId:string|null;importedCohortId:string;
 dependencyCount:number;reversedAt:Date|null;
}){
 return input.reversedAt===null&&input.currentCohortId===input.importedCohortId&&
  Number.isSafeInteger(input.dependencyCount)&&input.dependencyCount===0;
}

/** Replacement object cleanup is durable; a worker must verify no faculty
 * profile still references the key before using private-storage DELETE. */
export const facultyAvatarCleanupQueue=pgTable("faculty_avatar_cleanup_queue",{
 id:uuid("id").defaultRandom().primaryKey(),
 membershipId:uuid("membership_id").notNull().references(()=>collegeMemberships.id,{onDelete:"restrict"}),
 collegeId:uuid("college_id").notNull(),
 oldObjectKey:varchar("old_object_key",{length:1024}).notNull(),
 status:varchar("status",{length:16}).notNull().default("PENDING"),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
 completedAt:timestamp("completed_at",{withTimezone:true}),
},t=>[
 index("faculty_avatar_cleanup_pending_idx").on(t.status,t.createdAt),
 check("faculty_avatar_cleanup_status_ck",sql`${t.status} in ('PENDING','DONE','FAILED')`),
 check("faculty_avatar_cleanup_state_ck",sql`
  (${t.status}='DONE')=(${t.completedAt} is not null)`),
]);

/** Persisted source FacultyType is the Java ordinal, not a string. Preserve
 * its append-only ordering on approved legacy imports; employment title is
 * display metadata, while TPO/MENTOR/ADMIN access requires verified roles. */
export const LEGACY_FACULTY_TYPE_ORDINAL=[
 "PERMANENT","GUEST","VISITING","CONTRACT","ADMIN","HEAD","COORDINATOR",
 "CLERK","PROFESSOR","ASSOCIATE_PROFESSOR","ASSISTANT_PROFESSOR",
 "LECTURER","ADJUNCT","MENTOR","TPO",
] as const;
export type LegacyFacultyTypeCode=typeof LEGACY_FACULTY_TYPE_ORDINAL[number];
export function legacyFacultyTypeFromOrdinal(ordinal:number):{
 ordinal:number;type:LegacyFacultyTypeCode;employmentType:string;
 roleHint:"FACULTY"|"MENTOR"|"TPO"|"COLLEGE_ADMIN";
}{
 if(!Number.isInteger(ordinal)||ordinal<0||ordinal>=LEGACY_FACULTY_TYPE_ORDINAL.length)
  throw new Error("Unsupported historical faculty type ordinal");
 const type=LEGACY_FACULTY_TYPE_ORDINAL[ordinal];
 const roleHint=type==="MENTOR"?"MENTOR":type==="TPO"?"TPO":
  type==="ADMIN"?"COLLEGE_ADMIN":"FACULTY";
 return {ordinal,type,employmentType:type.replaceAll("_"," "),roleHint};
}
/** Role hints are NOT account grants: role activation needs an existing,
 * college-scoped membership with appropriate persisted permission. */
