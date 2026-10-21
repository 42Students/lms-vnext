import "server-only";
import {and,asc,eq,isNull,or} from "drizzle-orm";
import {getDb} from "@/db/client";
import {cohorts,learnerProgramEnrollments,programs,programTerms,
 sectionEnrollments,sections} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {CoursesServiceError} from "./errors";

import {type LearnerCourseSetupStatus} from "./learner-course-setup-copy";
/** LEARNER-home-courses-03: diagnose only the current learner's saved
 * academic setup, not other students or unrelated college records. */
export async function getLearnerCourseSetupStatus(context:RequestContext):Promise<LearnerCourseSetupStatus>{
 const member=context.membership;
 if(!member||member.status!=="ACTIVE"||!member.roles.includes("LEARNER")||
    context.user.platformStatus!=="ACTIVE")
  throw new CoursesServiceError("LEARNER_PROGRESS_ACCESS_DENIED");
 const db=getDb();
 const [enrollment]=await db.select({
  id:learnerProgramEnrollments.id,programId:learnerProgramEnrollments.programId,cohortId:learnerProgramEnrollments.cohortId,
 }).from(learnerProgramEnrollments)
 .where(and(eq(learnerProgramEnrollments.membershipId,member.id),
  eq(learnerProgramEnrollments.status,"ACTIVE"))).limit(1);
 if(!enrollment)return "NO_PROGRAM";
 const [program,cohort]=await Promise.all([
  db.select({id:programs.id,status:programs.status}).from(programs)
    .where(eq(programs.id,enrollment.programId)).limit(1).then(rows=>rows[0]),
  db.select({id:cohorts.id,status:cohorts.status}).from(cohorts)
    .where(eq(cohorts.id,enrollment.cohortId)).limit(1).then(rows=>rows[0]),
 ]);
 if(!program||program.status!=="ACTIVE")return "PROGRAM_NOT_FOUND";
 if(!enrollment.cohortId)return "NO_BATCH";
 if(!cohort||cohort.status==="ARCHIVED")return "BATCH_NOT_FOUND";
 const [terms,classRows]=await Promise.all([
  db.select({id:programTerms.id}).from(programTerms)
    .where(and(eq(programTerms.programId,enrollment.programId),or(isNull(programTerms.legacyWasDeleted),eq(programTerms.legacyWasDeleted,false)))).limit(1),
  db.select({id:sectionEnrollments.id,status:sections.status}).from(sectionEnrollments)
   .innerJoin(sections,eq(sections.id,sectionEnrollments.sectionId))
   .where(and(eq(sectionEnrollments.learnerEnrollmentId,enrollment.id),
      eq(sectionEnrollments.status,"ACTIVE"))).limit(1),
 ]);
 if(!classRows.length)return "NO_CLASS";
 if(classRows[0]?.status!=="ACTIVE")return "CLASS_NOT_FOUND";
 if(!terms.length)return "NO_SEMESTER";
 return "NO_COURSES";
}

/** LEARNER-home-courses-02: list every curriculum semester for the learner's
 * active program, even if its course deliveries have not been published yet. */
export async function listLearnerProgramSemesters(context:RequestContext){
 const member=context.membership;
 if(!member||member.status!=="ACTIVE"||!member.roles.includes("LEARNER")||
  context.user.platformStatus!=="ACTIVE")throw new CoursesServiceError("LEARNER_PROGRESS_ACCESS_DENIED");
 const db=getDb();
 const active=await db.select({programId:learnerProgramEnrollments.programId})
  .from(learnerProgramEnrollments)
  .where(and(eq(learnerProgramEnrollments.membershipId,member.id),
    eq(learnerProgramEnrollments.status,"ACTIVE"))).limit(1);
 if(!active[0])return [];
 return db.select({termNumber:programTerms.termNumber,name:programTerms.name,
  isActive:programTerms.isActive,legacySemesterId:programTerms.legacySemesterId})
  .from(programTerms).where(and(eq(programTerms.programId,active[0].programId),
   or(isNull(programTerms.legacyWasDeleted),eq(programTerms.legacyWasDeleted,false))))
  .orderBy(asc(programTerms.termNumber),asc(programTerms.id));
}

// Legacy semester-picker projection: inactive history is visible, deleted
// entries excluded; no caller-selected student or college is accepted.
export async function listOwnLearnerSemesterPicker(ctx:RequestContext){
 return (await listLearnerProgramSemesters(ctx)).map(item=>({
  semester:item.termNumber,name:item.name,
  legacySemesterId:item.legacySemesterId,isActive:item.isActive,
 }));
}
