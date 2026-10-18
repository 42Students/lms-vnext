import "server-only";
import {and,desc,eq,inArray,isNull,lte,gt,or} from "drizzle-orm";
import {getDb} from "@/db/client";
import {z} from "zod";
import {db10Announcements,learnerProgramEnrollments,sectionEnrollments,sections,users} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {placementTableExists} from "@/modules/placements/staged-tables";
import {requireOwnCourseLearnerRead} from "./learner-access-guard";
/** LEARNER-home-courses-14: official class-targeted announcements only.
 * Discussion posts are never reclassified as notices; no course-only
 * audience may be inferred from a class-wide announcement. */
export async function listLearnerCourseClassAnnouncements(
 context:RequestContext,sectionIdInput:string,now:Date=new Date(),
){
 const sectionId=z.string().uuid().parse(sectionIdInput);
 const member=await requireOwnCourseLearnerRead(context);
  const [section]=await getDb().select({id:sectionEnrollments.id})
   .from(sectionEnrollments)
   .innerJoin(learnerProgramEnrollments,eq(learnerProgramEnrollments.id,sectionEnrollments.learnerEnrollmentId))
   .innerJoin(sections,and(
    eq(sections.id,sectionEnrollments.sectionId),
    eq(sections.cohortId,learnerProgramEnrollments.cohortId),
    eq(sections.academicPeriodId,sectionEnrollments.academicPeriodId),
    eq(sections.status,"ACTIVE"),
   ))
   .where(and(
    eq(learnerProgramEnrollments.membershipId,member.id),
    eq(learnerProgramEnrollments.status,"ACTIVE"),
    eq(sectionEnrollments.sectionId,sectionId),
    eq(sectionEnrollments.status,"ACTIVE"),
   ))
   .limit(1);
 if(!section||!await placementTableExists("announcements"))return [];
 return getDb().select({
  id:db10Announcements.id,title:db10Announcements.title,messageText:db10Announcements.message,
  createdAt:db10Announcements.createdAt,senderName:users.displayName,
 }).from(db10Announcements)
  .leftJoin(users,eq(users.id,db10Announcements.senderUserId))
  .where(and(
   eq(db10Announcements.collegeId,member.collegeId),
   eq(db10Announcements.organizationId,member.organizationId),
   eq(db10Announcements.receiverType,"CLASS"),
   eq(db10Announcements.receiverId,sectionId),
   inArray(db10Announcements.senderType,["COLLEGE_ADMIN","FACULTY"]),
   isNull(db10Announcements.deletedAt),
   or(isNull(db10Announcements.scheduledAt),lte(db10Announcements.scheduledAt,now)),
   or(isNull(db10Announcements.expiresAt),gt(db10Announcements.expiresAt,now)),
  )).orderBy(desc(db10Announcements.createdAt),desc(db10Announcements.id)).limit(2);
}
