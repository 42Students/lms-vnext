import "server-only";
import {and,eq,exists,inArray,isNull,ne,or,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {activityEvents,collegeMemberships,membershipRoles,projectInstances,
 projectMembers,users} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";

/** SQL-correlated live role/tenant/project grant for the Mentor inbox.
 * A project removed during pagination is denied at the query boundary.
 * PROJECTS events without an authorized projectId fail closed.
 * Callers first validate live Mentor membership.
 */
export function mentorVisibleNotificationEventCondition(context:RequestContext){
 const membership=context.membership;
 if(!membership||membership.status!=="ACTIVE"||!membership.roles.includes("MENTOR"))
   return sql<boolean>`false`;
 return or(
   ne(activityEvents.module,"PROJECTS"),
   exists(getDb().select({id:projectMembers.id})
     .from(projectMembers)
     .innerJoin(projectInstances,and(
       eq(projectInstances.id,projectMembers.projectId),
       eq(projectInstances.collegeId,membership.collegeId),
       isNull(projectInstances.deletedAt),
     ))
     .innerJoin(collegeMemberships,and(
       eq(collegeMemberships.id,projectMembers.membershipId),
       eq(collegeMemberships.id,membership.id),
       eq(collegeMemberships.collegeId,membership.collegeId),
       eq(collegeMemberships.userId,context.user.id),
       eq(collegeMemberships.status,"ACTIVE"),
     ))
     .innerJoin(users,and(eq(users.id,collegeMemberships.userId),
       eq(users.platformStatus,"ACTIVE")))
     .innerJoin(membershipRoles,and(
       eq(membershipRoles.membershipId,collegeMemberships.id),
       eq(membershipRoles.role,"MENTOR"),
     ))
     .where(and(
       eq(projectMembers.role,"MENTOR"),
       isNull(projectMembers.endedAt),
       eq(activityEvents.collegeId,membership.collegeId),
       eq(activityEvents.organizationId,membership.organizationId),
       or(
         sql`${activityEvents.metadata} ->> 'projectId' = ${projectMembers.projectId}::text`,
         and(
           // Metadata projectId is authoritative when present: a foreign
           // project reference must never be rescued by an unrelated local
           // subjectId. The subject fallback is exclusively for legacy
           // direct-project events with no metadata projectId at all.
           sql`${activityEvents.metadata} ->> 'projectId' is null`,
           inArray(activityEvents.subjectType,["project","project_instance"]),
           sql`${activityEvents.subjectId} = ${projectMembers.projectId}::text`,
         ),
       ),
     ))),
 )!;
}
