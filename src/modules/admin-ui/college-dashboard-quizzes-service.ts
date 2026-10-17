import "server-only";
import {and,asc,count,eq,gt,lte} from "drizzle-orm";
import {getDb} from "@/db/client";
import {courseQuizzes,courseLessons,courseLearningPaths,courses,departments} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requirePermission} from "@/modules/permissions/policy";
/** COL-dashboard-09: quiz due dates are authoritative, never fabricated. */
export async function getCollegeClosingQuizzes(ctx:RequestContext,now=new Date()){
 const member=ctx.membership;
 if(!member||member.status!=="ACTIVE")throw Error("COLLEGE_MEMBERSHIP_REQUIRED");
 requirePermission(ctx,"courses.read",{collegeId:member.collegeId,organizationId:member.organizationId});
 const end=new Date(now.getTime()+7*86400000), db=getDb();
 const source=db.select({id:courseQuizzes.id,title:courseQuizzes.title,
  course:courses.name,dueAt:courseQuizzes.dueAt})
 .from(courseQuizzes)
 .innerJoin(courseLessons,eq(courseLessons.id,courseQuizzes.lessonId))
 .innerJoin(courseLearningPaths,eq(courseLearningPaths.id,courseLessons.learningPathId))
 .innerJoin(courses,eq(courses.id,courseLearningPaths.courseId))
 .innerJoin(departments,eq(departments.id,courses.departmentId))
 .where(and(eq(departments.collegeId,member.collegeId),
  eq(courseQuizzes.status,"PUBLISHED"),gt(courseQuizzes.dueAt,now),
  lte(courseQuizzes.dueAt,end))).as("closing_quizzes");
 const [total,items]=await Promise.all([
  db.select({total:count()}).from(source),
  db.select().from(source).orderBy(asc(source.dueAt)).limit(10),
 ]);
 return{total:total[0]?.total??0,items};
}
