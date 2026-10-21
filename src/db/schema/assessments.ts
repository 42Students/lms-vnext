import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
  uuid,
} from "drizzle-orm/pg-core";
import {
  courseLessons,
  courseSectionDeliveries,
} from "./courses";
import { collegeMemberships } from "./memberships";
import { users } from "./users";
import {
  assignmentGradingStatusEnum,
  assignmentSubmissionTypeEnum,
  courseAssignmentStatusEnum,
} from "./enums";

export const courseAssignments = pgTable(
  "course_assignments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    /** Original lesson content identity is import-only; do not cast to UUID. */
    legacyLessonContentId: integer("legacy_lesson_content_id"),
    lessonId: uuid("lesson_id")
      .notNull()
      .references(() => courseLessons.id, {
        onDelete: "restrict",
      }),
    deliveryId: uuid("delivery_id")
      .references(() => courseSectionDeliveries.id, {
        onDelete: "restrict",
      }),
    title: text("title").notNull(),
    description: text("description"),
    dueAt: timestamp("due_at", {
      withTimezone: true,
    }),
    maxPoints: integer("max_points").notNull(),
    sequence: integer("sequence").notNull(),
    status: courseAssignmentStatusEnum("status")
      .notNull()
      .default("DRAFT"),
    /** FAC-assessments-01/02: allowed learner submission methods (JSON array, 1-5 entries). */
    allowedSubmissionMethods: jsonb("allowed_submission_methods")
      .$type<string[]>()
      .notNull()
      .default(["WRITTEN_RESPONSE"]),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "restrict",
      }),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex(
      "course_assignments_generic_active_name_uq",
    )
      .on(
        table.lessonId,
        sql`lower(${table.title})`,
      )
      .where(
        sql`${table.deliveryId} is null and ${table.status} <> 'ARCHIVED'`,
      ),
    uniqueIndex(
      "course_assignments_delivery_active_name_uq",
    )
      .on(
        table.lessonId,
        table.deliveryId,
        sql`lower(${table.title})`,
      )
      .where(
        sql`${table.deliveryId} is not null and ${table.status} <> 'ARCHIVED'`,
      ),
    uniqueIndex(
      "course_assignments_generic_active_sequence_uq",
    )
      .on(table.lessonId, table.sequence)
      .where(
        sql`${table.deliveryId} is null and ${table.status} <> 'ARCHIVED'`,
      ),
    uniqueIndex(
      "course_assignments_delivery_active_sequence_uq",
    )
      .on(
        table.lessonId,
        table.deliveryId,
        table.sequence,
      )
      .where(
        sql`${table.deliveryId} is not null and ${table.status} <> 'ARCHIVED'`,
      ),
    uniqueIndex("course_assignments_legacy_content_uq").on(table.legacyLessonContentId)
      .where(sql`${table.legacyLessonContentId} is not null`),
    index(
      "course_assignments_lesson_status_idx",
    ).on(table.lessonId, table.status),
    index(
      "course_assignments_delivery_status_idx",
    ).on(table.deliveryId, table.status),
    check(
      "course_assignments_points_ck",
      sql`${table.maxPoints} between 0 and 10000`,
    ),
    check(
      "course_assignments_sequence_ck",
      sql`${table.sequence} >= 0`,
    ),
    check(
      "course_assignments_methods_shape_ck",
      sql`jsonb_typeof(${table.allowedSubmissionMethods}) = 'array' and jsonb_array_length(${table.allowedSubmissionMethods}) between 1 and 5`,
    ),
  ],
);

export const assignmentSubmissions = pgTable(
  "assignment_submissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    legacyStudentAssignmentId: bigint("legacy_student_assignment_id",{mode:"bigint"}),
    legacyLearnerId: integer("legacy_learner_id"),
    assignmentId: uuid("assignment_id")
      .notNull()
      .references(() => courseAssignments.id, {
        onDelete: "restrict",
      }),
    deliveryId: uuid("delivery_id")
      .notNull()
      .references(() => courseSectionDeliveries.id, {
        onDelete: "restrict",
      }),
    membershipId: uuid("membership_id")
      .notNull()
      .references(() => collegeMemberships.id, {
        onDelete: "restrict",
      }),
    submissionType:
      assignmentSubmissionTypeEnum(
        "submission_type",
      ).notNull(),
    textContent: text("text_content"),
    submissionUrl: text("submission_url"),
    submittedAt: timestamp("submitted_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    pointsAwarded: integer("points_awarded"),
    /** Immutable grade ceiling from when the learner submitted, if known. */
    maxPointsAtSubmission: integer("max_points_at_submission"),
    /** Exact source BIGINT grade before safe normalization to integer. */
    legacyPointsAwarded: bigint("legacy_points_awarded",{mode:"bigint"}),
    deletedAt: timestamp("deleted_at",{withTimezone:true}),
    // Legacy fidelity (migration 0098): resubmission counter and prior grade.
    attemptNumber: integer("attempt_number").notNull().default(1),
    /** Legacy semester snapshot; use the existing row as the active attempt aggregate. */
    semesterNumber: integer("semester_number"),
    /** Import display provenance; live names come from authorized joins. */
    legacySubmissionSnapshot: jsonb("legacy_submission_snapshot")
      .$type<Record<string, unknown>>(),
    previousPoints: integer("previous_points"),
    feedback: text("feedback"),
    gradingStatus:
      assignmentGradingStatusEnum(
        "grading_status",
      )
        .notNull()
        .default("NOT_GRADED"),
    /** Legacy source kind preserves AUTO/MANUAL/PARTIAL without enabling AI grading. */
    legacyGradingKind: text("legacy_grading_kind"),
    gradePublished: boolean("grade_published")
      .notNull()
      .default(false),
    gradedByUserId: uuid("graded_by_user_id")
      .references(() => users.id, {
        onDelete: "restrict",
      }),
    gradedAt: timestamp("graded_at", {
      withTimezone: true,
    }),
    version: integer("version")
      .notNull()
      .default(0),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("assignment_submissions_legacy_source_uq").on(table.legacyStudentAssignmentId)
      .where(sql`${table.legacyStudentAssignmentId} is not null`),
    index("assignment_submissions_live_lookup_idx").on(table.assignmentId,table.deletedAt,table.submittedAt),
    check("assignment_submissions_max_snapshot_ck",sql`
      ${table.maxPointsAtSubmission} is null or
      ${table.maxPointsAtSubmission} between 0 and 10000`),
    uniqueIndex(
      "assignment_submissions_assignment_membership_uq",
    ).on(
      table.assignmentId,
      table.membershipId,
    ),
    // Parent key for assignment_submission_files composite tenant/owner FK.
    uniqueIndex("assignment_submissions_id_assignment_member_uq").on(
      table.id,
      table.assignmentId,
      table.membershipId,
    ),
    uniqueIndex("assignment_submissions_grade_audit_parent_uq").on(
      table.id,table.assignmentId,table.deliveryId,table.membershipId,
    ),
    index(
      "assignment_submissions_assignment_delivery_idx",
    ).on(
      table.assignmentId,
      table.deliveryId,
    ),
    index(
      "assignment_submissions_membership_idx",
    ).on(table.membershipId),
    check(
      "assignment_submissions_payload_ck",
      sql`(
        (${table.submissionType} = 'TEXT'
          and ${table.textContent} is not null
          and length(trim(${table.textContent})) > 0
          and ${table.submissionUrl} is null)
        or
        (${table.submissionType} = 'LINK'
          and ${table.submissionUrl} is not null
          and ${table.textContent} is null)
        or
        (${table.submissionType} = 'FILE')
      )`,
    ),
    // FILE submissions carry their files in assignment_submission_files; a
    // deferred constraint trigger (migration 0080) requires at least one
    // READY file at commit time.
    check(
      "assignment_submissions_semester_ck",
      sql`${table.semesterNumber} is null or ${table.semesterNumber} > 0`,
    ),
    check(
      "assignment_submissions_legacy_grade_kind_ck",
      sql`${table.legacyGradingKind} is null or ${table.legacyGradingKind} in ('NOT_GRADED', 'AUTO_GRADED', 'MANUALLY_GRADED', 'PARTIALLY_GRADED')`,
    ),
    check(
      "assignment_submissions_legacy_snapshot_ck",
      sql`${table.legacySubmissionSnapshot} is null or jsonb_typeof(${table.legacySubmissionSnapshot}) = 'object'`,
    ),
    check(
      "assignment_submissions_attempt_ck",
      sql`${table.attemptNumber} >= 1 and (${table.previousPoints} is null or ${table.previousPoints} >= 0)`,
    ),
    check(
      "assignment_submissions_points_ck",
      sql`${table.pointsAwarded} is null or ${table.pointsAwarded} >= 0`,
    ),
    check(
      "assignment_submissions_version_ck",
      sql`${table.version} >= 0`,
    ),
    check(
      "assignment_submissions_grading_ck",
      sql`(
        (${table.gradingStatus} = 'NOT_GRADED'
          and ${table.pointsAwarded} is null
          and ${table.gradedByUserId} is null
          and ${table.gradedAt} is null
          and ${table.gradePublished} = false)
        or
        (${table.gradingStatus} = 'GRADED'
          and ${table.pointsAwarded} is not null
          and ${table.gradedByUserId} is not null
          and ${table.gradedAt} is not null)
      )`,
    ),
  ],
);


/** Per-assignment resource builder: exactly one Instructions entry at most,
 * with ordered repeatable PDF, File and Link entries. Private file objects
 * must be CLEAN scanned and ownership-verified before insertion. */
export const courseAssignmentResources=pgTable("course_assignment_resources",{
 id:uuid("id").defaultRandom().primaryKey(),
 assignmentId:uuid("assignment_id").notNull()
   .references(()=>courseAssignments.id,{onDelete:"restrict"}),
 kind:varchar("kind",{length:16}).notNull(),
 title:varchar("title",{length:255}).notNull(),
 body:text("body"),
 externalUrl:text("external_url"),
 privateObjectKey:varchar("private_object_key",{length:1024}),
 contentType:varchar("content_type",{length:128}),
 contentBytes:integer("content_bytes"),
 sha256Hex:varchar("sha256_hex",{length:64}),
 objectGeneration:varchar("object_generation",{length:64}),
 position:integer("position").notNull(),
 createdByUserId:uuid("created_by_user_id").notNull()
   .references(()=>users.id,{onDelete:"restrict"}),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
 updatedAt:timestamp("updated_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[
 uniqueIndex("course_assignment_resources_position_uq").on(t.assignmentId,t.position),
 uniqueIndex("course_assignment_resources_one_instructions_uq")
   .on(t.assignmentId).where(sql`${t.kind}='INSTRUCTIONS'`),
 index("course_assignment_resources_assignment_kind_idx").on(t.assignmentId,t.kind),
 check("course_assignment_resources_kind_ck",sql`
  ${t.kind} in ('INSTRUCTIONS','PDF','FILE','LINK')`),
 check("course_assignment_resources_position_ck",sql`${t.position} between 0 and 99`),
 check("course_assignment_resources_title_ck",sql`length(btrim(${t.title})) between 1 and 255`),
 check("course_assignment_resources_shape_ck",sql`
  (${t.kind}='INSTRUCTIONS' and
    ${t.body} is not null and length(btrim(${t.body})) between 1 and 10000
    and ${t.externalUrl} is null and ${t.privateObjectKey} is null)
  or (${t.kind}='LINK' and ${t.body} is null
    and ${t.externalUrl} ~ '^https://[^[:space:]]+$'
    and length(${t.externalUrl})<=2048 and ${t.privateObjectKey} is null)
  or (${t.kind} in ('PDF','FILE') and ${t.body} is null
    and ${t.externalUrl} is null and ${t.privateObjectKey} is not null
    and ${t.contentBytes} between 1 and 52428800
    and ${t.sha256Hex} ~ '^[a-f0-9]{64}$'
    and ${t.objectGeneration} is not null
    and ${t.contentType} is not null
    and (${t.kind}<>'PDF' or ${t.contentType}='application/pdf'))`),
]);

/** Import mapping for the historic four-state grade marker. The source
 * label is retained in legacyGradingKind; a historical AUTO grade is never
 * authority to perform automated grading in the new product. */
export type LegacyAssignmentGradingStatus =
  "NOT_GRADED"|"AUTO_GRADED"|"MANUALLY_GRADED"|"PARTIALLY_GRADED";
export function legacyAssignmentGradeState(value:LegacyAssignmentGradingStatus):{
 gradingStatus:"NOT_GRADED"|"GRADED";
 legacyGradingKind:LegacyAssignmentGradingStatus;
 displayLabel:string;
}{
 const labels:Record<LegacyAssignmentGradingStatus,string>={
  NOT_GRADED:"Not graded",AUTO_GRADED:"Auto graded (historical)",
  MANUALLY_GRADED:"Manually graded",PARTIALLY_GRADED:"Partially graded",
 };
 return {gradingStatus:value==="NOT_GRADED"?"NOT_GRADED":"GRADED",
  legacyGradingKind:value,displayLabel:labels[value]};
}
export function assignmentGradeDisplayStatus(input:{
 gradingStatus:string;legacyGradingKind:string|null;
}):string{
 const supported=["NOT_GRADED","AUTO_GRADED","MANUALLY_GRADED","PARTIALLY_GRADED"] as const;
 const source=supported.find(value=>value===input.legacyGradingKind);
 return source?legacyAssignmentGradeState(source).displayLabel:
  input.gradingStatus==="GRADED"?"Graded":"Not graded";
}
