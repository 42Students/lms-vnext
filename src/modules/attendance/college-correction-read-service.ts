import "server-only";
import {and,asc,eq,gt,lt} from "drizzle-orm";
import {getDb} from "@/db/client";
import {academicPeriods,attendancePolicies,attendanceSessions,cohorts,departments,programs,
  sectionScheduleEvents,sections} from "@/db/schema";
import {isSuperAdmin,type RequestContext} from "@/modules/identity/context";
import {getCollegeAttendancePolicy} from "./policy-service";
import {collegeCorrectionReadSchema,istCorrectionWindow,projectCorrectionSessions}
  from "./college-correction-read-model";

export async function getCollegeCorrectionRead(context:RequestContext,raw:unknown) {
  const query=collegeCorrectionReadSchema.parse(raw);
  const collegeId=context.membership?.collegeId ??
    (isSuperAdmin(context) ? context.adminScope?.collegeId : null);
  if(!collegeId)throw new Error("Select an authorized college to read attendance corrections.");
  // Same central college scope guard protects members and acting Super Admins.
  const {college,policy}=await getCollegeAttendancePolicy(context,collegeId);
  const db=getDb();
  const [configured]=await db.select({collegeId:attendancePolicies.collegeId})
    .from(attendancePolicies).where(eq(attendancePolicies.collegeId,college.id)).limit(1);
  if(!query.from||!query.to) return {
    collegeName:college.name,policy,policySource:configured?"SAVED" as const:"DEFAULT" as const,
    queried:false as const,query,items:[],truncated:false,correctionRequestHistory:null,
  };
  const {start,endExclusive}=istCorrectionWindow(query.from,query.to);
  const rows=await db.select({
    id:sectionScheduleEvents.id,title:sectionScheduleEvents.title,
    sectionName:sections.name,startsAt:sectionScheduleEvents.startsAt,
    endsAt:sectionScheduleEvents.endsAt,
    attendanceStatus:attendanceSessions.status,markedAt:attendanceSessions.markedAt,
  }).from(sectionScheduleEvents)
    .innerJoin(sections,eq(sections.id,sectionScheduleEvents.sectionId))
    .innerJoin(academicPeriods,and(
      eq(academicPeriods.id,sections.academicPeriodId),
      eq(academicPeriods.collegeId,college.id),
    ))
    .innerJoin(cohorts,eq(cohorts.id,sections.cohortId))
    .innerJoin(programs,eq(programs.id,cohorts.programId))
    .innerJoin(departments,and(eq(departments.id,programs.departmentId),
      eq(departments.collegeId,college.id)))
    .leftJoin(attendanceSessions,eq(attendanceSessions.scheduleEventId,sectionScheduleEvents.id))
    .where(and(eq(sectionScheduleEvents.status,"SCHEDULED"),
      lt(sectionScheduleEvents.startsAt,endExclusive),gt(sectionScheduleEvents.endsAt,start)))
    .orderBy(asc(sectionScheduleEvents.startsAt),asc(sectionScheduleEvents.id))
    .limit(251);
  return {
    collegeName:college.name,policy,policySource:configured?"SAVED" as const:"DEFAULT" as const,
    queried:true as const,query,
    items:projectCorrectionSessions(rows.slice(0,250),policy.correctionWindowHours,new Date()),
    truncated:rows.length>250,correctionRequestHistory:null,
  };
}
