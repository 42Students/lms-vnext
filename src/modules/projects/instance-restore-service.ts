import "server-only";
import {and,desc,eq,isNull,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {activityEvents,collegeMemberships,membershipRoles,projectInstances,projectMembers,users} from "@/db/schema";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {resolveOptionalModuleAccess} from "@/modules/module-access/service";
import type {RequestContext} from "@/modules/identity/context";
import {requireProjectManageAccess} from "./access";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {ProjectsServiceError} from "./errors";
import {restoreProjectInstanceInputSchema,restoredProjectStatus} from "./instance-restore-model";
import {notifyActiveProjectMembers} from "./project-notification-service";

export async function restoreProjectInstance(context:RequestContext,projectIdInput:string,raw:unknown){
  const scope=await requireProjectManageAccess(context,projectIdInput);
  if(!(await resolveOptionalModuleAccess(context)).projects.enabled)
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  const input=restoreProjectInstanceInputSchema.parse(raw);
  return getDb().transaction(async tx=>{
    const [project]=await tx.select().from(projectInstances)
      .where(and(eq(projectInstances.id,scope.project.id),eq(projectInstances.collegeId,scope.collegeId)))
      .for("update").limit(1);
    if(!project)throw new ProjectsServiceError("PROJECT_NOT_FOUND");
    // A stale tab can outlive College Admin or Super Admin role removal.
    // Check the persisted actor inside the same locked restoration transaction
    // so a revoked session cannot re-activate a previously archived workspace.
    await assertPersistedPlatformPermission(tx,context,"projects.manage",{
      organizationId:scope.organizationId,collegeId:scope.collegeId,
    });
    // Archived and soft-deleted workspaces are not interchangeable. A
    // permanent/deleted legacy row must not be resurrected via archive restore.
    if(project.deletedAt||project.status!=="ARCHIVED"||
       project.updatedAt.getTime()!==Date.parse(input.expectedUpdatedAt))
      throw new ProjectsServiceError("PROJECT_INVALID_STATE");
    const [mentor]=await tx.select({id:projectMembers.id}).from(projectMembers)
      .innerJoin(collegeMemberships,eq(collegeMemberships.id,projectMembers.membershipId))
      .innerJoin(users,eq(users.id,collegeMemberships.userId))
      .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),
        eq(membershipRoles.role,"MENTOR")))
      .where(and(eq(projectMembers.projectId,project.id),eq(projectMembers.role,"MENTOR"),
        eq(projectMembers.isPrimary,true),isNull(projectMembers.endedAt),
        eq(collegeMemberships.collegeId,scope.collegeId),eq(collegeMemberships.status,"ACTIVE"),
        eq(users.platformStatus,"ACTIVE"))).limit(1);
    // Legacy deletedByWorkspace identified members removed by workspace
    // deletion. Archive restore preserves ended memberships and never
    // silently re-grants access to inactive/removed learners or mentors.
    // Legacy allows restoring a mentorless deleted workspace as BLOCKED.
    // The vNext status constraint has no BLOCKED workspace state; restore to
    // PLANNED and persist an explicit blocker until an active mentor is assigned.
    // Never reactivate an ended project-member assignment automatically.
    const [lastArchive]=await tx.select({metadata:activityEvents.metadata}).from(activityEvents)
      .where(and(eq(activityEvents.eventType,ACTIVITY_EVENT_TYPES.PROJECTS_PROJECT_ARCHIVED),
        eq(activityEvents.subjectType,"project_instance"),eq(activityEvents.subjectId,project.id),
        eq(activityEvents.collegeId,scope.collegeId)))
      .orderBy(desc(activityEvents.occurredAt),desc(activityEvents.id)).limit(1);
    const status=mentor?restoredProjectStatus(lastArchive?.metadata?.previousStatus):"PLANNED";
    const mentorBlocker="Primary mentor missing. Assign an active mentor before resuming this workspace.";
    const now=new Date(Math.max(Date.now(),project.updatedAt.getTime()+1));
    const [restored]=await tx.update(projectInstances).set({status,archivedAt:null,
      ...(mentor?{}:{blocker:mentorBlocker}),updatedAt:now})
      .where(and(eq(projectInstances.id,project.id),eq(projectInstances.collegeId,scope.collegeId),
        eq(projectInstances.status,"ARCHIVED"),sql`date_trunc('milliseconds', ${projectInstances.updatedAt}) = ${new Date(input.expectedUpdatedAt).toISOString()}::timestamptz`))
      .returning();
    if(!restored)throw new ProjectsServiceError("PROJECT_INVALID_STATE");
    const restoredEvent=await recordActivityEventInTransaction(tx,context,{
      eventType:ACTIVITY_EVENT_TYPES.PROJECTS_PROJECT_RESTORED,
      collegeId:scope.collegeId,organizationId:scope.organizationId,
      subjectType:"project_instance",subjectId:restored.id,subjectLabel:restored.title,
      summary:"Project "+restored.title+" restored",
      metadata:{projectId:restored.id,previousStatus:"ARCHIVED",status:restored.status,
       mentorMissing:!mentor,manualMentorAssignmentRequired:!mentor,
       restoreKind:"ARCHIVE_RESTORE",membershipsRecreated:false,
       previousMentorPresent:Boolean(mentor),needsMentorReview:!mentor},
      groupKey:"projects:instance:"+restored.id,
      dedupeKey:"projects:instance:"+restored.id+":restored:"+now.toISOString(),
    });
    await notifyActiveProjectMembers(tx,restoredEvent.id,{
      projectId:restored.id,collegeId:scope.collegeId,roles:["LEARNER"],
      exceptUserId:context.user.id,title:"Project restored",
      body:restored.title+" has been restored.",
      actionHref:"/learn/projects/"+restored.id,
    });
    await notifyActiveProjectMembers(tx,restoredEvent.id,{
      projectId:restored.id,collegeId:scope.collegeId,roles:["MENTOR"],
      exceptUserId:context.user.id,title:"Project restored",
      body:restored.title+" has been restored.",
      actionHref:"/mentor/projects/"+restored.id,
    });
    return restored;
  });
}
