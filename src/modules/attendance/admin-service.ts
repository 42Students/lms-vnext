import "server-only";

import {
  and,
  asc,
  eq,
  gte,
  inArray,
  lt,
  sql,
} from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import {
  academicPeriods,
  activityEvents,
  attendancePolicies,
  attendanceRecords,
  attendanceSessions,
  colleges,
  collegeMemberships,
  courseOfferings,
  courseSectionDeliveries,
  courses,
  departments,
  sectionScheduleEventCourses,
  sectionScheduleEvents,
  sections,
  users,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import {
  hasMembershipRole,
  isSuperAdmin,
} from "@/modules/identity/context";
import {
  requirePermission,
} from "@/modules/permissions/policy";
import { CoursesServiceError } from "@/modules/courses/errors";
import {
  listActiveDeliveryLearners,
} from "@/modules/courses/delivery-roster";
import { indiaAttendanceMonthWindow } from "./month-window";
import {enqueueAttendanceParentSms,dispatchQueuedAttendanceParentSms} from "./parent-sms-service";
import {legacyFormalTitle} from "@/modules/courses/course-legacy-parity-model";
import {facultyAttendanceNextMarkedAt} from "./faculty-correction-token-model";
import {adminAttendanceCorrectionChange,adminAttendanceRecordTokenMatches} from "./admin-correction-change-model";


/** Options are independent reads. A failed class-offering query must never
 * be rendered as a verified empty course list. */
export class AdminAttendanceOptionsLookupError extends Error {
 constructor(public readonly kind:"class_courses"|"college_courses"|"policy"){
  super("ATTENDANCE_OPTIONS_"+kind.toUpperCase()+"_UNAVAILABLE");
  this.name="AdminAttendanceOptionsLookupError";
 }
}

/** Legacy-facing copy for recoverable schedule/correction errors.
 * Internal permission and tenant failure details must not be exposed.
 */
export const adminAttendanceActionErrorCopy = {
  SCHEDULE_EVENT_NOT_FOUND: "Class schedule not found",
  CONTENT_DELIVERY_MISMATCH: "Class schedule not found",
  ATTENDANCE_ROSTER_CONFLICT: "Learner is not enrolled in this class",
  ATTENDANCE_VERSION_CONFLICT: "Attendance changed. Please refresh and try again.",
  ATTENDANCE_STALE_VERSION: "Attendance changed. Please refresh and try again.",
} as const;

const uuid = z.string().uuid();
const correctionSchema = z.strictObject({
  collegeId: uuid,
  deliveryId: uuid,
  membershipId: uuid,
  status: z.enum([
    "PRESENT",
    "ABSENT",
    "EXCUSED",
    "MEDICAL",
    "LATE",
  ]),
  note: z.string().trim().max(500,{error:"Keep the correction note under 500 characters"}).optional(),
  expectedMarkedAt: z.union([z.iso.datetime({offset:true}),z.null()]).optional(),
});

export async function requireAttendanceCollege(
  context: RequestContext,
  collegeIdInput: string,
) {
  const collegeId = uuid.parse(collegeIdInput);

  // A global or organization-scoped Super Admin may choose a target
  // college. The persisted organization+college permission check below is
  // authoritative, rather than requiring an unrelated college membership.
  if (!isSuperAdmin(context) && (
    !context.membership ||
    !hasMembershipRole(
      context,
      "COLLEGE_ADMIN",
    ) ||
    context.membership.collegeId !== collegeId
  )) {
    throw new CoursesServiceError(
      "LEARNING_ACCESS_DENIED",
    );
  }

  const [college] = await getDb()
    .select({
      id: colleges.id,
      organizationId: colleges.organizationId,
      name: colleges.name,
      code: colleges.code,
    })
    .from(colleges)
    .where(
      and(
        eq(colleges.id, collegeId),
        eq(colleges.status, "ACTIVE"),
      ),
    )
    .limit(1);

  if (!college) {
    throw new CoursesServiceError(
      "LEARNING_ACCESS_DENIED",
    );
  }

  requirePermission(
    context,
    "academics.manage",
    {
      organizationId: college.organizationId,
      collegeId: college.id,
    },
  );

  return college;
}

export async function getAdminAttendanceOptions(
  context: RequestContext,
  collegeIdInput: string,
) {
  const college =
    await requireAttendanceCollege(
      context,
      collegeIdInput,
    );

  const [policyResult, deliveryResult, coursesResult] =
    await Promise.allSettled([
      getDb()
        .select({
          eligibilityThresholdPercent:
            attendancePolicies.eligibilityThresholdPercent,
          correctionWindowHours:
            attendancePolicies.correctionWindowHours,
        })
        .from(attendancePolicies)
        .where(
          eq(
            attendancePolicies.collegeId,
            college.id,
          ),
        )
        .limit(1),
      getDb()
        .select({
          deliveryId:
            courseSectionDeliveries.id,
          sectionId: sections.id,
          sectionName: sections.name,
          sectionCode: sections.code,
          courseId: courses.id,
          courseName: courses.name,
          courseShortTitle: courses.shortTitle,
          courseCode: courses.code,
          offeringType:courseOfferings.type,
          isPast:sql<boolean>`(${courseSectionDeliveries.endedAt} is not null or ${academicPeriods.endDate} < (now() at time zone 'Asia/Kolkata')::date)`,
          academicPeriodId:
            academicPeriods.id,
          academicPeriodName:
            academicPeriods.name,
        })
        .from(courseSectionDeliveries)
        .innerJoin(
          courseOfferings,
          eq(
            courseOfferings.id,
            courseSectionDeliveries.offeringId,
          ),
        )
        .innerJoin(
          courses,
          eq(
            courses.id,
            courseOfferings.courseId,
          ),
        )
        .innerJoin(
          departments,
          and(
            eq(
              departments.id,
              courses.departmentId,
            ),
            eq(
              departments.collegeId,
              college.id,
            ),
          ),
        )
        .innerJoin(
          sections,
          eq(
            sections.id,
            courseSectionDeliveries.sectionId,
          ),
        )
        .innerJoin(
          academicPeriods,
          eq(
            academicPeriods.id,
            courseOfferings.academicPeriodId,
          ),
        )
        .where(
          and(
            eq(courseOfferings.status, "ACTIVE"),
            eq(courses.status, "ACTIVE"),
            eq(sections.status, "ACTIVE"),
            eq(academicPeriods.collegeId, college.id),
            eq(sections.academicPeriodId, academicPeriods.id),
          ),
        )
        .orderBy(
          asc(sections.name),
          asc(courses.name),
          sql`case when ${courseSectionDeliveries.endedAt} is null and ${academicPeriods.endDate} >= (now() at time zone 'Asia/Kolkata')::date then 0 else 1 end`,
          asc(courseSectionDeliveries.id),
        ),
      getDb()
        .select({
          id: courses.id,
          code: courses.code,
          name: courses.name,
          shortTitle: courses.shortTitle,
        })
        .from(courses)
        .innerJoin(departments, eq(departments.id, courses.departmentId))
        .where(and(
          eq(departments.collegeId, college.id),
          eq(courses.status, "ACTIVE"),
        ))
        .orderBy(asc(courses.name), asc(courses.id)),
    ]);
  if(deliveryResult.status==="rejected")
    throw new AdminAttendanceOptionsLookupError("class_courses");
  if(coursesResult.status==="rejected")
    throw new AdminAttendanceOptionsLookupError("college_courses");
  if(policyResult.status==="rejected")
    throw new AdminAttendanceOptionsLookupError("policy");
  const policyRows=policyResult.value;
  const deliveries=deliveryResult.value;
  const allCourses=coursesResult.value;

  return {
    college,
    policy:
      policyRows[0] ?? {
        eligibilityThresholdPercent: 75,
        correctionWindowHours: 24,
      },
    deliveries: deliveries.map(({courseShortTitle,...delivery}) => ({
      ...delivery,
      // Legacy formal_title is shortTitle when non-null, otherwise name.
      formalTitle: legacyFormalTitle({
        name: delivery.courseName, shortTitle: courseShortTitle,
      }),
    })),
    courses: allCourses.map(({shortTitle,...course}) => ({
      ...course,
      formalTitle: legacyFormalTitle({name: course.name,shortTitle}),
    })),
  };
}

async function requireAdminDelivery(
  context: RequestContext,
  collegeIdInput: string,
  deliveryIdInput: string,
) {
  const options =
    await getAdminAttendanceOptions(
      context,
      collegeIdInput,
    );
  const deliveryId =
    uuid.parse(deliveryIdInput);
  const delivery =
    options.deliveries.find(
      (item) =>
        item.deliveryId === deliveryId,
    );

  if (!delivery) {
    throw new CoursesServiceError(
      "CONTENT_DELIVERY_MISMATCH",
    );
  }

  return {
    ...options,
    delivery,
  };
}

export async function getAdminAttendanceGrid(
  context: RequestContext,
  rawInput: {
    collegeId: string;
    deliveryId: string;
    month: string;
  },
) {
  const { college, policy, delivery } =
    await requireAdminDelivery(
      context,
      rawInput.collegeId,
      rawInput.deliveryId,
    );
  const window = indiaAttendanceMonthWindow(rawInput.month);

  const sessions = await getDb()
    .select({
      id: sectionScheduleEvents.id,
      title: sectionScheduleEvents.title,
      startsAt: sectionScheduleEvents.startsAt,
      endsAt: sectionScheduleEvents.endsAt,
      location: sectionScheduleEvents.location,
      attendanceStatus:
        attendanceSessions.status,
      attendanceMarkedAt:
        attendanceSessions.markedAt,
      attendanceMarkedByUserId:
        attendanceSessions.markedByUserId,
      attendanceMarkedByName:
        users.displayName,
    })
    .from(sectionScheduleEventCourses)
    .innerJoin(
      sectionScheduleEvents,
      eq(
        sectionScheduleEvents.id,
        sectionScheduleEventCourses.scheduleEventId,
      ),
    )
    .leftJoin(
      attendanceSessions,
      eq(
        attendanceSessions.scheduleEventId,
        sectionScheduleEvents.id,
      ),
    )
    .leftJoin(
      users,
      eq(
        users.id,
        attendanceSessions.markedByUserId,
      ),
    )
    .where(
      and(
        eq(
          sectionScheduleEventCourses.deliveryId,
          delivery.deliveryId,
        ),
        eq(
          sectionScheduleEvents.sectionId,
          delivery.sectionId,
        ),
        eq(
          sectionScheduleEvents.status,
          "SCHEDULED",
        ),
        gte(
          sectionScheduleEvents.startsAt,
          window.start,
        ),
        lt(
          sectionScheduleEvents.startsAt,
          window.end,
        ),
      ),
    )
    .orderBy(
      asc(sectionScheduleEvents.startsAt),
      asc(sectionScheduleEvents.id),
    );

  const roster =
    await listActiveDeliveryLearners({
      deliveryId: delivery.deliveryId,
      sectionId: delivery.sectionId,
      academicPeriodId:
        delivery.academicPeriodId,
      collegeId: college.id,
    });

  const records =
    sessions.length === 0 || roster.length === 0
      ? []
      : await getDb()
          .select({
            id: attendanceRecords.id,
            scheduleEventId:
              attendanceRecords.scheduleEventId,
            membershipId:
              attendanceRecords.membershipId,
            status: attendanceRecords.status,
            note: attendanceRecords.note,
            markedByUserId:
              attendanceRecords.markedByUserId,
            markedByName:
              users.displayName,
            markedAt:
              attendanceRecords.markedAt,
          })
          .from(attendanceRecords)
          .innerJoin(
            collegeMemberships,
            eq(collegeMemberships.id, attendanceRecords.membershipId),
          )
          .innerJoin(
            users,
            eq(
              users.id,
              attendanceRecords.markedByUserId,
            ),
          )
          .where(and(
            eq(collegeMemberships.collegeId, college.id),
            inArray(
              attendanceRecords.scheduleEventId,
              sessions.map((session) => session.id),
            ),
            inArray(
              attendanceRecords.membershipId,
              roster.map((learner) => learner.membershipId),
            ),
          ));

  return {
    college,
    policy,
    delivery,
    month: window.month,
    roster,
    sessions,
    records,
  };
}

/** A class/course/period must resolve to an authorized delivery. A legacy
 * date-range query may include several explicitly selected deliveries, each
 * keeping its own Section roster and academic-period identity.
 */
export async function getAdminAttendanceDateRangeReport(context:RequestContext,raw:unknown) {
 const input=z.strictObject({
  collegeId:uuid,deliveryIds:z.array(uuid).min(1).max(4),
  startDate:z.iso.date(),endDate:z.iso.date(),onlyAbsent:z.boolean().default(false),
 }).parse(raw);
 const start=new Date(input.startDate+"T00:00:00+05:30");
 const end=new Date(input.endDate+"T00:00:00+05:30");
 if(input.startDate>input.endDate||!Number.isFinite(start.getTime())||
  !Number.isFinite(end.getTime())||end.getTime()-start.getTime()>186*86400000)
  throw new CoursesServiceError("ATTENDANCE_RANGE_INVALID");
 const months:string[]=[];
 const first=input.startDate.slice(0,7),last=input.endDate.slice(0,7);
 const [year,month]=first.split("-").map(Number);
 for(let i=0;i<=6;i++){
  const cursor=new Date(Date.UTC(year,month-1+i,1)).toISOString().slice(0,7);
  if(cursor>last)break;
  months.push(cursor);
 }
 if(!months.length||months[months.length-1]!==last)
  throw new CoursesServiceError("ATTENDANCE_RANGE_INVALID");
 const deliveryIds=[...new Set(input.deliveryIds)];
 const grids=await Promise.all(deliveryIds.flatMap(deliveryId=>months.map(async month=>({
  deliveryId,grid:await getAdminAttendanceGrid(context,{
   collegeId:input.collegeId,deliveryId,month,
  }),
 }))));
 const indiaDay=(date:Date):string=>{
  const parts=new Intl.DateTimeFormat("en-US",{timeZone:"Asia/Kolkata",
   year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(date);
  const part=(type:string)=>parts.find(x=>x.type===type)?.value??"";
  return part("year")+"-"+part("month")+"-"+part("day");
 };
 const schedules=grids.flatMap(({deliveryId,grid})=>{
  const rosterById=new Map(grid.roster.map(row=>[row.membershipId,row]));
  return grid.sessions.filter(session=>{
   const day=indiaDay(session.startsAt);
   return day>=input.startDate&&day<=input.endDate;
  }).map(session=>{
   const records=grid.records.filter(row=>row.scheduleEventId===session.id);
   const mapped=records.map(row=>({
    membershipId:row.membershipId,
    name:rosterById.get(row.membershipId)?.displayName??"Name not recorded",
    status:row.status,markedAt:row.markedAt,
   }));
   return {
    scheduleId:session.id,deliveryId,sectionId:grid.delivery.sectionId,
    academicPeriodId:grid.delivery.academicPeriodId,
    sectionName:grid.delivery.sectionName,courseName:grid.delivery.courseName,
    title:session.title,startsAt:session.startsAt,endsAt:session.endsAt,
    attendanceStatus:session.attendanceStatus,rosterCount:grid.roster.length,
    absentees:mapped.filter(row=>row.status==="ABSENT"),
    attendees:mapped.filter(row=>row.status!=="ABSENT"),
   };
  });
 });
 const filtered=input.onlyAbsent?schedules.filter(row=>row.absentees.length>0):schedules;
 return {collegeId:input.collegeId,startDate:input.startDate,endDate:input.endDate,
  deliveryIds,onlyAbsent:input.onlyAbsent,schedules:filtered,
  totalSessions:filtered.length,
  totalAbsences:filtered.reduce((sum,row)=>sum+row.absentees.length,0),
  note:"Active delivery enrollment defines report membership. Unmarked sessions are not presumed present."};
}

/** Exotel DLT template and guardian consent are required for SMS. Failure is
 * queued/observable separately; a successful attendance write is not a
 * guarantee that a provider accepted the SMS request. */
export const ADMIN_ATTENDANCE_SMS_STATUS_COPY={
 NOT_CONFIGURED:"Guardian SMS is unavailable. Attendance was still saved.",
 PENDING:"Guardian SMS is queued; delivery has not been confirmed.",
 FAILED:"Guardian SMS could not be delivered. Attendance was still saved.",
 SENT:"Guardian SMS request was sent to the provider.",
} as const;

/** Read a fresh tenant-scoped record and a stable optimistic token. */
export async function getAdminCurrentAttendanceRecord(context:RequestContext,raw:unknown) {
  const input=z.strictObject({
    collegeId:uuid,deliveryId:uuid,scheduleEventId:uuid,membershipId:uuid,
  }).parse(raw);
  const {college,delivery}=await requireAdminDelivery(context,input.collegeId,input.deliveryId);
  const [event]=await getDb().select({id:sectionScheduleEvents.id})
    .from(sectionScheduleEvents)
    .innerJoin(sectionScheduleEventCourses,
      eq(sectionScheduleEventCourses.scheduleEventId,sectionScheduleEvents.id))
    .where(and(
      eq(sectionScheduleEvents.id,input.scheduleEventId),
      eq(sectionScheduleEvents.sectionId,delivery.sectionId),
      eq(sectionScheduleEventCourses.deliveryId,delivery.deliveryId),
    )).limit(1);
  if(!event)throw new CoursesServiceError("CONTENT_DELIVERY_MISMATCH");
  const roster=await listActiveDeliveryLearners({
    deliveryId:delivery.deliveryId,sectionId:delivery.sectionId,
    academicPeriodId:delivery.academicPeriodId,collegeId:college.id,
  });
  if(!roster.some(item=>item.membershipId===input.membershipId))
    throw new CoursesServiceError("ATTENDANCE_ROSTER_CONFLICT");
  const [record]=await getDb().select({
    status:attendanceRecords.status,note:attendanceRecords.note,
    markedAt:attendanceRecords.markedAt,
  }).from(attendanceRecords).where(and(
    eq(attendanceRecords.scheduleEventId,input.scheduleEventId),
    eq(attendanceRecords.membershipId,input.membershipId),
  )).limit(1);
  return {scheduleEventId:input.scheduleEventId,membershipId:input.membershipId,
    status:record?.status??"PRESENT",note:record?.note??null,
    expectedMarkedAt:record?.markedAt?.toISOString()??null};
}

export async function correctAdminAttendance(
  context: RequestContext,
  scheduleEventIdInput: string,
  rawInput: unknown,
) {
  const scheduleEventId =
    uuid.parse(scheduleEventIdInput);
  const input =
    correctionSchema.parse(rawInput);
  const { college, delivery } =
    await requireAdminDelivery(
      context,
      input.collegeId,
      input.deliveryId,
    );

  const roster =
    await listActiveDeliveryLearners({
      deliveryId: delivery.deliveryId,
      sectionId: delivery.sectionId,
      academicPeriodId:
        delivery.academicPeriodId,
      collegeId: college.id,
    });
  if (
    !roster.some(
      (row) =>
        row.membershipId ===
        input.membershipId,
    )
  ) {
    throw new CoursesServiceError(
      "ATTENDANCE_ROSTER_CONFLICT",
    );
  }

  const receipt=await getDb().transaction(
    async (tx) => {
      const [event] = await tx
        .select({
          id: sectionScheduleEvents.id,
          sectionId:
            sectionScheduleEvents.sectionId,
          deliveryId:
            sectionScheduleEventCourses.deliveryId,
          status:
            sectionScheduleEvents.status,
          startsAt: sectionScheduleEvents.startsAt,
          endsAt: sectionScheduleEvents.endsAt,
        })
        .from(sectionScheduleEvents)
        .innerJoin(
          sectionScheduleEventCourses,
          eq(
            sectionScheduleEventCourses.scheduleEventId,
            sectionScheduleEvents.id,
          ),
        )
        .where(and(
          eq(sectionScheduleEvents.id, scheduleEventId),
          eq(sectionScheduleEventCourses.deliveryId, delivery.deliveryId),
          eq(sectionScheduleEvents.sectionId, delivery.sectionId),
        ))
        .for("update")
        .limit(1);

      if (
        !event ||
        event.status !== "SCHEDULED" ||
        event.sectionId !==
          delivery.sectionId ||
        event.deliveryId !==
          delivery.deliveryId
      ) {
        throw new CoursesServiceError(
          "CONTENT_DELIVERY_MISMATCH",
        );
      }

      const now = new Date();
      // College Admin can correct old attendance after the Faculty window,
      // but not a future class that has not started. The legacy service
      // rejects pre-start marking; no owner exception has been approved.
      if(event.startsAt.getTime()>now.getTime())
        throw new CoursesServiceError("ATTENDANCE_NOT_STARTED");
      // Lock and recheck active same-college membership at mutation time.
      const [activeMember] = await tx
        .select({ id: collegeMemberships.id })
        .from(collegeMemberships)
        .where(and(
          eq(collegeMemberships.id, input.membershipId),
          eq(collegeMemberships.collegeId, college.id),
          eq(collegeMemberships.status, "ACTIVE"),
        ))
        .for("update")
        .limit(1);
      if (!activeMember) {
        throw new CoursesServiceError("ATTENDANCE_ROSTER_CONFLICT");
      }

      const [priorRecord]=await tx.select({
        id:attendanceRecords.id,status:attendanceRecords.status,note:attendanceRecords.note,
        markedAt:attendanceRecords.markedAt,
      }).from(attendanceRecords).where(and(
        eq(attendanceRecords.scheduleEventId,scheduleEventId),
        eq(attendanceRecords.membershipId,input.membershipId),
      )).for("update").limit(1);
      // A requested compare-and-set token prevents overwriting another
      // administrator's correction made after the current-record read.
      if (!adminAttendanceRecordTokenMatches(
        input.expectedMarkedAt,priorRecord?.markedAt??null,
      )) {
        throw new CoursesServiceError("ATTENDANCE_STALE_VERSION");
      }
      const change=adminAttendanceCorrectionChange({
        previous:priorRecord
          ?{status:priorRecord.status,note:priorRecord.note}:null,
        requestedStatus:input.status,requestedNote:input.note,
      });
      // Repeating the same status and same note cannot create a false
      // correction event, increment a token or resend a parent's SMS.
      if(!change.changed){
        return {scheduleEventId,membershipId:input.membershipId,
          status:input.status,correctedAt:now,smsOutboxId:null};
      }
      // Monotonic per-record token. Two corrections in one millisecond must
      // not expose the same compare-and-set value to another administrator.
      const correctedMarkedAt=facultyAttendanceNextMarkedAt(
        now,priorRecord?.markedAt??null,
      );
      if(priorRecord){
        await tx.update(attendanceRecords).set({
          status:input.status,note:change.nextNote,
          markedByUserId:context.user.id,
          markedAt:correctedMarkedAt,updatedAt:correctedMarkedAt,
        }).where(eq(attendanceRecords.id,priorRecord.id));
      }else{
        // An explicit PRESENT note also deserves a durable review record;
        // the default implicit PRESENT with no note remains a no-op.
        await tx.insert(attendanceRecords).values({
          scheduleEventId,membershipId:input.membershipId,
          status:input.status,note:change.nextNote,
          markedByUserId:context.user.id,
          markedAt:correctedMarkedAt,updatedAt:correctedMarkedAt,
        });
      }

      // College Admin must never create a MARKED session: that would
      // falsely count all other learners present. However, if Faculty has
      // already marked the session, an admin correction must advance its
      // optimistic token so a previously opened Faculty editor cannot
      // silently revert this administrator-reviewed change.
      const [markedSession] = await tx.select({
        status: attendanceSessions.status,
        markedAt: attendanceSessions.markedAt,
      }).from(attendanceSessions)
        .where(eq(attendanceSessions.scheduleEventId, scheduleEventId))
        .for("update").limit(1);
      if (markedSession?.status === "MARKED" && markedSession.markedAt) {
        const correctionToken = facultyAttendanceNextMarkedAt(now, markedSession.markedAt);
        await tx.update(attendanceSessions).set({
          markedAt: correctionToken, markedByUserId: context.user.id,
          updatedAt: correctionToken,
        }).where(eq(attendanceSessions.scheduleEventId, scheduleEventId));
      }

      // COL-attendance-02: persist audit in this same transaction,
      // including explicit PRESENT corrections with the same retained row ID.
      const [audit]=await tx.insert(activityEvents).values({
        organizationId:college.organizationId,
        collegeId:college.id,
        actorUserId:context.user.id,
        actorMembershipId:context.membership?.collegeId===college.id
          ?context.membership?.id??null:null,
        module:"COURSES",
        eventType:input.status==="PRESENT"?"ADMIN_ATTENDANCE_MARK_PRESENT":"ADMIN_ATTENDANCE_MARK_ABSENT",
        subjectType:"attendance_session",
        subjectId:scheduleEventId,
        subjectLabel:"Attendance correction",
        summary:change.statusChanged
          ?"College Admin corrected attendance"
          :"College Admin updated an attendance note",
        metadata:{
          deliveryId:delivery.deliveryId,
          learnerMembershipId:input.membershipId,
          from:change.previousStatus,to:input.status,
          statusChanged:change.statusChanged,
          noteChanged:change.noteChanged,
          correctionNote:change.nextNote,
        },
        occurredAt:now,
      }).returning({id:activityEvents.id});
      const smsKind=change.shouldNotifyAbsent?"ABSENT" as const:
       change.shouldNotifyCorrected?"CORRECTED" as const:null;
      const smsOutboxId=smsKind&&audit?await enqueueAttendanceParentSms(tx,{
       eventId:audit.id,collegeId:college.id,membershipId:input.membershipId,
       scheduleEventId,kind:smsKind,courseName:delivery.courseName,
       startsAt:event.startsAt,endsAt:event.endsAt,
      }):null;
      return {
        scheduleEventId,
        membershipId: input.membershipId,
        status: input.status,
        correctedAt: now,
        smsOutboxId,
      };
    },
  );
  // Provider I/O is never part of the attendance mutation transaction.
  // Rejections or absent DLT credentials cannot roll back the correction.
  const {smsOutboxId,...publicReceipt}=receipt;
  if(smsOutboxId)await dispatchQueuedAttendanceParentSms(smsOutboxId).catch(()=>undefined);
  return publicReceipt;
}
