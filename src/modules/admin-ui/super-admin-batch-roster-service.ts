import "server-only";
import {AuthorizationError} from "@/modules/permissions/policy";
import {and,asc,countDistinct,eq,inArray} from "drizzle-orm";
import {getDb} from "@/db/client";
import {cohorts,departments,programs,sections,sectionEnrollments,learnerProgramEnrollments,collegeMemberships,users,learnerProfiles} from "@/db/schema";
import {resolveActingCollege} from "@/modules/permissions/acting-college";
import {isSuperAdmin,type RequestContext} from "@/modules/identity/context";
import {z} from "zod";

/** One selected academic cohort, with per-class occupancy from persisted active enrollment. */
export async function getSuperAdminBatchRosterOverview(context:RequestContext,rawId:unknown){
 const batchId=z.uuid().parse(rawId);
 if(!isSuperAdmin(context))throw new AuthorizationError("academics.read");
 const scope=await resolveActingCollege(context,"academics.read");
 const db=getDb();
 const [batch]=await db.select({
  id:cohorts.id,name:cohorts.name,code:cohorts.code,programName:programs.name,
 }).from(cohorts)
  .innerJoin(programs,eq(programs.id,cohorts.programId))
  .innerJoin(departments,and(eq(departments.id,programs.departmentId),eq(departments.collegeId,scope.collegeId)))
  .where(eq(cohorts.id,batchId)).limit(1);
 if(!batch)return null;
 const classes=await db.select({
  id:sections.id,name:sections.name,code:sections.code,capacity:sections.capacity,status:sections.status,academicPeriodId:sections.academicPeriodId,
  // Match the active roster: a disabled platform account is not an attendee.
  learnerCount:countDistinct(users.id),
 }).from(sections)
  .leftJoin(sectionEnrollments,and(eq(sectionEnrollments.sectionId,sections.id),eq(sectionEnrollments.status,"ACTIVE")))
  .leftJoin(learnerProgramEnrollments,and(eq(learnerProgramEnrollments.id,sectionEnrollments.learnerEnrollmentId),
    eq(learnerProgramEnrollments.cohortId,batchId),eq(learnerProgramEnrollments.status,"ACTIVE")))
  .leftJoin(collegeMemberships,and(eq(collegeMemberships.id,learnerProgramEnrollments.membershipId),
    eq(collegeMemberships.collegeId,scope.collegeId),eq(collegeMemberships.status,"ACTIVE")))
  .leftJoin(users,and(eq(users.id,collegeMemberships.userId),eq(users.platformStatus,"ACTIVE")))
  .where(eq(sections.cohortId,batchId))
  .groupBy(sections.id,sections.name,sections.code,sections.capacity,sections.status)
  .orderBy(asc(sections.name),asc(sections.id));
 // No authorized Sections means no learner roster to enumerate.
 if(classes.length===0)return {batch,classes,roster:[]};
 const active=await db.select({
  learnerEnrollmentId:learnerProgramEnrollments.id,memberId:collegeMemberships.id,
  name:users.displayName,email:users.email,roll:learnerProfiles.rollNumber,
  classId:sectionEnrollments.sectionId,
 }).from(learnerProgramEnrollments)
  .innerJoin(collegeMemberships,and(eq(collegeMemberships.id,learnerProgramEnrollments.membershipId),
    eq(collegeMemberships.collegeId,scope.collegeId),eq(collegeMemberships.status,"ACTIVE")))
  .innerJoin(users,and(eq(users.id,collegeMemberships.userId),eq(users.platformStatus,"ACTIVE")))
  .leftJoin(learnerProfiles,eq(learnerProfiles.membershipId,collegeMemberships.id))
  .leftJoin(sectionEnrollments,and(eq(sectionEnrollments.learnerEnrollmentId,learnerProgramEnrollments.id),
    eq(sectionEnrollments.status,"ACTIVE"),
    inArray(sectionEnrollments.sectionId,classes.map(item=>item.id).length?classes.map(item=>item.id):[batchId])))
  .where(and(eq(learnerProgramEnrollments.cohortId,batchId),eq(learnerProgramEnrollments.status,"ACTIVE")))
  .orderBy(asc(users.displayName),asc(collegeMemberships.id));
 return {batch,classes,roster:active};
}
