import { sql } from "drizzle-orm";
import {
  boolean,
  check,
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
import { collegeMemberships } from "./memberships";
import { sectionScheduleEvents } from "./academics";
import { users } from "./users";

export const attendancePolicies = pgTable(
  "attendance_policies",
  {
    collegeId: uuid("college_id")
      .primaryKey()
      .references(() => colleges.id, {
        onDelete: "restrict",
      }),
    eligibilityThresholdPercent: integer(
      "eligibility_threshold_percent",
    )
      .notNull()
      .default(75),
    correctionWindowHours: integer(
      "correction_window_hours",
    )
      .notNull()
      .default(24),
    updatedByUserId: uuid(
      "updated_by_user_id",
    ).references(() => users.id, {
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
    check(
      "attendance_policies_threshold_ck",
      sql`${table.eligibilityThresholdPercent} between 1 and 100`,
    ),
    check(
      "attendance_policies_correction_window_ck",
      sql`${table.correctionWindowHours} between 1 and 168`,
    ),
  ],
);

export const attendanceSessions = pgTable(
  "attendance_sessions",
  {
    /** Numeric source schedule key; not a native event FK. */
    legacyClassScheduleId: integer("legacy_class_schedule_id"),
    legacyAttendanceMarkedAt: timestamp("legacy_attendance_marked_at", { withTimezone: true }),
    legacyClassId: integer("legacy_class_id"),
    legacyCourseId: integer("legacy_course_id"),
    legacyFacultyId: integer("legacy_faculty_id"),
    scheduleEventId: uuid("schedule_event_id")
      .primaryKey()
      .references(() => sectionScheduleEvents.id, {
        onDelete: "cascade",
      }),
    status: varchar("status", {
      length: 24,
    })
      .notNull()
      .default("UNMARKED"),
    markedByUserId: uuid(
      "marked_by_user_id",
    ).references(() => users.id, {
      onDelete: "restrict",
    }),
    markedAt: timestamp("marked_at", {
      withTimezone: true,
    }),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index(
      "attendance_sessions_status_idx",
    ).on(table.status, table.updatedAt),
    index("attendance_sessions_marked_at_idx").on(table.markedAt,table.scheduleEventId)
      .where(sql`${table.status} = 'MARKED'`),
    check(
      "attendance_sessions_status_ck",
      sql`${table.status} in ('UNMARKED', 'MARKED')`,
    ),
    check(
      "attendance_sessions_lifecycle_ck",
      sql`(${table.status} = 'UNMARKED'
          and ${table.markedByUserId} is null
          and ${table.markedAt} is null)
        or (${table.status} = 'MARKED'
          and ${table.markedByUserId} is not null
          and ${table.markedAt} is not null)`,
    ),
  ],
);

export const attendanceRecords = pgTable(
  "attendance_records",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    /** Source attend rows are absences only and may have unknown original actor. */
    legacyAttendId: integer("legacy_attend_id"),
    legacyClassScheduleId: integer("legacy_class_schedule_id"),
    legacyStudentId: text("legacy_student_id"),
    legacyAttendanceStatus: varchar("legacy_attendance_status", { length: 20 }),
    legacyAbsenceReason: text("legacy_absence_reason"),
    legacyMarkedById: integer("legacy_marked_by_id"),
    legacyWasDeleted: boolean("legacy_was_deleted"),
    scheduleEventId: uuid("schedule_event_id")
      .notNull()
      .references(() => sectionScheduleEvents.id, {
        onDelete: "cascade",
      }),
    membershipId: uuid("membership_id")
      .notNull()
      .references(() => collegeMemberships.id, {
        onDelete: "restrict",
      }),
    status: varchar("status", {
      length: 24,
    }).notNull(),
    note: varchar("note", { length: 1000 }),
    markedByUserId: uuid(
      "marked_by_user_id",
    )
      .notNull()
      .references(() => users.id, {
        onDelete: "restrict",
      }),
    markedAt: timestamp("marked_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    version: integer("version").notNull().default(0),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex(
      "attendance_records_event_membership_uq",
    ).on(
      table.scheduleEventId,
      table.membershipId,
    ),
    index(
      "attendance_records_membership_event_idx",
    ).on(
      table.membershipId,
      table.scheduleEventId,
    ),
    index(
      "attendance_records_event_status_idx",
    ).on(
      table.scheduleEventId,
      table.status,
    ),
    check("attendance_records_version_ck", sql`${table.version} >= 0`),
    check(
      "attendance_records_status_ck",
      sql`${table.status} in ('PRESENT', 'ABSENT', 'EXCUSED', 'MEDICAL', 'LATE')`,
    ),
  ],
);

/** An empty exception list means everyone present ONLY after a session was
 * marked; otherwise a newly scheduled class has no attendance yet. */
export function legacyAttendanceMarkSummary(input:{
  marked:boolean;absenceCount:number;
}):"Not marked"|"Marked"|"All present"{
  return !input.marked?"Not marked":input.absenceCount===0?"All present":"Marked";
}

/** The full historical reason remains in legacyAbsenceReason even if the
 * current editable note has a 1,000-character cap. */
export function legacyAttendanceAbsence(input:{
  legacyAttendId:number;sourceReason:string|null;markedAt:Date;
  /** Legacy attend.attendance_status: NULL is a plain unexplained absence;
   * EXCUSED, MEDICAL and LATE are explicit codes that must be preserved. */
  sourceStatus?:string|null;
}){
  const code=input.sourceStatus?.trim().toUpperCase()??"";
  const status=code==="EXCUSED"||code==="MEDICAL"||code==="LATE"
    ?code:"ABSENT" as const;
  return {legacyAttendId:input.legacyAttendId,status,
    legacyAbsenceReason:input.sourceReason,note:input.sourceReason?.slice(0,1000)??null,
    markedAt:input.markedAt};
}

/** Import a marked-but-all-present source session without creating fake
 * PRESENT rows. A missing actor must be remapped before marking, not guessed. */
export function legacyAttendanceSessionState(input:{
  sourceMarked:boolean;sourceMarkedAt:Date|null;actorUserId:string|null;
  /** Legacy absence rows imply the session was marked even when the source
   * attendanceMarkedAt flag is missing (adminAttendanceGrid isSessionCounted). */
  absenceCount?:number;earliestAbsenceMarkedAt?:Date|null;
}){
  const impliedMarked=(input.absenceCount??0)>0;
  const markedAt=input.sourceMarkedAt??(impliedMarked?input.earliestAbsenceMarkedAt??null:null);
  if((input.sourceMarked||impliedMarked)&&markedAt&&input.actorUserId)
    return {status:"MARKED" as const,markedAt,markedByUserId:input.actorUserId};
  return {status:"UNMARKED" as const,markedAt:null,markedByUserId:null};
}

export function legacyAttendanceCollegeThreshold(percent:number|null):number{
  return percent!==null&&Number.isInteger(percent)&&percent>=1&&percent<=100?percent:75;
}

/** The historical all-scheduled count is NOT the attendance denominator.
 * Include only already-started, non-cancelled class events; for subject
 * eligibility pass a verified courseSectionDeliveryId and use that course
 * instead of silently combining all subjects. A legitimately unmarked but
 * started session contributes to the "held" count as in legacy backend. */
export function countHeldLegacyScheduleEvents(
 rows:readonly {
  sectionId:string;courseSectionDeliveryId:string|null;
  status:string;startsAt:Date;legacyWasDeleted?:boolean|null;
 }[],
 options:{sectionId:string;courseSectionDeliveryId?:string;now:Date},
):number{
 const time=options.now.getTime();
 if(!Number.isFinite(time))throw new Error("Invalid attendance cutoff");
 return rows.filter(row=>row.sectionId===options.sectionId&&
  (options.courseSectionDeliveryId===undefined||
   row.courseSectionDeliveryId===options.courseSectionDeliveryId)&&
  row.status==="SCHEDULED"&&row.legacyWasDeleted!==true&&
  Number.isFinite(row.startsAt.getTime())&&
  row.startsAt.getTime()<=time).length;
}
