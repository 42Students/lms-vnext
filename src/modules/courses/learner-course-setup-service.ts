import "server-only";
import {and,eq} from "drizzle-orm";
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
    .where(eq(programTerms.programId,enrollment.programId)).limit(1),
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
