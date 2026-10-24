import "server-only";
import {and,eq,gte,or,sql,isNull} from "drizzle-orm";
import {getDb} from "@/db/client";
import {activityEvents,collegeMemberships,projectMembers,users} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireProjectReadAccess} from "./access";
import type {MentorWeekContributor} from "./mentor-week-contributor-model";

/** Query the whole authenticated project's activity for the current IST week,
 * not just the first 100 feed events. Count zero-event students as zero.
 * A task updated by somebody else does not count toward a student's actions.
 */
export async function listMentorWeekContributors(
 context:RequestContext,projectId:string,now:Date=new Date(),
):Promise<MentorWeekContributor[]>{
 const scope=await requireProjectReadAccess(context,projectId);
 if(scope.access!=="MENTOR")return [];
 const ist=new Date(now.getTime()+330*60000);
 const weekday=(ist.getUTCDay()+6)%7;
 const from=new Date(Date.UTC(ist.getUTCFullYear(),ist.getUTCMonth(),
   ist.getUTCDate()-weekday)-330*60000);
 const [learners,actions]=await Promise.all([
  getDb().select({
    membershipId:projectMembers.membershipId,
    userId:users.id,name:users.displayName,
  }).from(projectMembers)
    .innerJoin(collegeMemberships,eq(
      collegeMemberships.id,projectMembers.membershipId))
    .innerJoin(users,eq(users.id,collegeMemberships.userId))
    .where(and(eq(projectMembers.projectId,scope.project.id),
      eq(projectMembers.role,"LEARNER"),isNull(projectMembers.endedAt),
      eq(collegeMemberships.collegeId,scope.collegeId),
      eq(collegeMemberships.status,"ACTIVE"),
      eq(users.platformStatus,"ACTIVE"))),
  getDb().select({
    userId:activityEvents.actorUserId,total:sql<number>`count(*)::int`,
  }).from(activityEvents).where(and(
    eq(activityEvents.module,"PROJECTS"),
    eq(activityEvents.collegeId,scope.collegeId),
    gte(activityEvents.occurredAt,from),
    or(
      and(or(eq(activityEvents.subjectType,"project"),
             eq(activityEvents.subjectType,"project_instance")),
          eq(activityEvents.subjectId,scope.project.id)),
      sql`${activityEvents.metadata} ->> 'projectId' = ${scope.project.id}`,
      scope.project.legacyProjectId!==null?
        eq(activityEvents.legacyProjectId,scope.project.legacyProjectId):undefined,
    ),
  )).groupBy(activityEvents.actorUserId),
 ]);
 const counts=new Map(actions.map(row=>[row.userId,Number(row.total)] as const));
 return learners.map(row=>({
  membershipId:row.membershipId,name:row.name||"Student",
  eventCount:counts.get(row.userId)??0,
 }));
}
