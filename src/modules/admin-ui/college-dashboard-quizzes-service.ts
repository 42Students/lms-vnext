import "server-only";
import {and,asc,count,eq,gte,lt,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {courseQuizzes,courseLessons,courseLearningPaths,courseOfferings,courses,departments,courseSectionDeliveries,sections} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requirePermission} from "@/modules/permissions/policy";
/** COL-dashboard-09: quiz due dates are authoritative, never fabricated. */
export async function getCollegeClosingQuizzes(ctx:RequestContext,now=new Date()){
 const member=ctx.membership;
 if(!member||member.status!=="ACTIVE")throw Error("COLLEGE_MEMBERSHIP_REQUIRED");
 requirePermission(ctx,"courses.read",{collegeId:member.collegeId,organizationId:member.organizationId});
 const offset=330*60_000;
 const shifted=new Date(now.getTime()+offset);
 const indiaMidnight=Date.UTC(shifted.getUTCFullYear(),shifted.getUTCMonth(),shifted.getUTCDate())-offset;
 const end=new Date(indiaMidnight+8*86400000), db=getDb();
 const source=db.select({id:courseQuizzes.id,title:courseQuizzes.title,
  course:courses.name,dueAt:courseQuizzes.dueAt,
  className:sql<string>`coalesce((select string_agg(distinct ${sections.name}, ', ')
    from ${courseSectionDeliveries}
    join ${sections} on ${sections.id} = ${courseSectionDeliveries.sectionId}
    where ${courseSectionDeliveries.offeringId} = ${courseOfferings.id}
      and ${courseSectionDeliveries.endedAt} is null), 'All eligible classes')`.as("quiz_class_name")})
 .from(courseQuizzes)
 .innerJoin(courseLessons,eq(courseLessons.id,courseQuizzes.lessonId))
 .innerJoin(courseLearningPaths,eq(courseLearningPaths.id,courseLessons.learningPathId))
 .innerJoin(courseOfferings,eq(courseOfferings.id,courseLearningPaths.offeringId))
 .innerJoin(courses,eq(courses.id,courseOfferings.courseId))
 .innerJoin(departments,eq(departments.id,courses.departmentId))
 .where(and(eq(departments.collegeId,member.collegeId),
  eq(courseQuizzes.status,"PUBLISHED"),gte(courseQuizzes.dueAt,now),
  lt(courseQuizzes.dueAt,end))).as("closing_quizzes");
 const [total,items]=await Promise.all([
  db.select({total:count()}).from(source),
  db.select().from(source).orderBy(asc(source.dueAt)).limit(8),
 ]);
 return{total:total[0]?.total??0,items};
}
