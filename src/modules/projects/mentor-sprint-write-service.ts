import "server-only";

import { randomUUID } from "node:crypto";
import { and, desc, eq, ne, isNull, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { mayCloseProjectSprint } from "./sprint-close-policy";
import {mentorSprintCarryUndoReceiptSchema,mentorSprintCanUndoCarriedTasks} from "./mentor-sprint-carry-undo-model";
import { projectInstances, projectReleases, projectSprints, projectTasks, projectMembers, activityEvents } from "@/db/schema";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import type { RequestContext } from "@/modules/identity/context";
import { requireProjectLifecycleMutationAccess } from "./access";
import {assertPersistedProjectMutationActor} from "./persisted-mentor-mutation";
import { ProjectsServiceError, postgresConstraintName } from "./errors";
import {
  mentorSprintCreateParamsSchema, mentorSprintCreateSchema,
  mentorSprintTransitionParamsSchema, mentorSprintTransitionSchema,
  isValidMentorSprintTransition,
} from "./mentor-sprint-write-model";

/** Old LMS permits active-project mentor actions. In vNext PLANNED and
 * ACTIVE projects are editable, COMPLETED and ARCHIVED read-only. Sprint
 * transitions keep their own versioned state checks, rather than assuming
 * that one legacy integer revision equals a JS timestamp.
 */
export const MENTOR_SPRINT_PROJECT_WRITE_STATES={
 PLANNED:true,ACTIVE:true,COMPLETED:false,ARCHIVED:false,
} as const;
export function mentorSprintProjectWritable(status:string):boolean{
 return status==="PLANNED"||status==="ACTIVE";
}
export function legacySprintRevisionToUpdatedAt(
 legacyVersion:number,approved:ReadonlyMap<number,string>,
):string|null{
 if(!Number.isSafeInteger(legacyVersion)||legacyVersion<0)return null;
 const mapped=approved.get(legacyVersion);
 if(!mapped||!Number.isFinite(new Date(mapped).getTime()))return null;
 return new Date(mapped).toISOString();
}
async function mentorSprintWriteScope(context: RequestContext, projectId: string) {
  return requireProjectLifecycleMutationAccess(context, projectId);
}

/** Serializes sprint creations under project-row lock, avoiding sibling sequence races. */
export async function createMentorProjectSprint(
  context:RequestContext,rawParams:unknown,rawInput:unknown,
) {
  const params=mentorSprintCreateParamsSchema.parse(rawParams);
  const input=mentorSprintCreateSchema.parse(rawInput);
  const scope=await mentorSprintWriteScope(context,params.projectId);
  try {
    return await getDb().transaction(async tx=>{
      const [project]=await tx.select({status:projectInstances.status})
        .from(projectInstances)
        .where(and(eq(projectInstances.id,scope.project.id),
          eq(projectInstances.collegeId,scope.collegeId)))
        .for("update").limit(1);
      if(!project || !mentorSprintProjectWritable(project.status)) {
        throw new ProjectsServiceError("PROJECT_SPRINT_INVALID_STATE");
      }
      await assertPersistedProjectMutationActor(tx,context,scope);
      const [release]=await tx.select({id:projectReleases.id,status:projectReleases.status})
        .from(projectReleases)
        .where(and(eq(projectReleases.id,input.releaseId),
          eq(projectReleases.projectId,scope.project.id),isNull(projectReleases.deletedAt)))
        .for("update").limit(1);
      if(!release || release.status==="SHIPPED") {
        throw new ProjectsServiceError("PROJECT_RELEASE_INVALID_STATE");
      }
      const existingKeys=await tx.select({
        templateKey:projectSprints.templateKey,legacySprintKey:projectSprints.legacySprintKey,
        deletedAt:projectSprints.deletedAt,
      }).from(projectSprints).where(eq(projectSprints.projectId,scope.project.id));
      const liveKeys=existingKeys.filter(row=>!row.deletedAt);
      if(liveKeys.length>=500)
        throw new ProjectsServiceError("PROJECT_SPRINT_INVALID_STATE");
      const usedKeys=new Set(liveKeys.flatMap(row=>
        [row.templateKey,row.legacySprintKey].filter((key):key is string=>Boolean(key))
          .map(key=>key.toLowerCase())));
      const requestedKey=input.key?.trim()??"";
      if(requestedKey&&usedKeys.has(requestedKey.toLowerCase()))
        throw new ProjectsServiceError("PROJECT_SPRINT_INVALID_STATE");
      const slug=input.title.toLowerCase().normalize("NFKD")
        .replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,64);
      const baseKey=slug||"sprint";
      let resolvedKey=requestedKey||baseKey;
      if(!requestedKey){
        let suffix=2;
        while(usedKeys.has(resolvedKey.toLowerCase())){
          const tail="-"+suffix++;
          resolvedKey=baseKey.slice(0,120-tail.length)+tail;
        }
      }
      const [last]=await tx.select({sequence:projectSprints.sequence})
        .from(projectSprints)
        .where(eq(projectSprints.releaseId,release.id))
        .orderBy(desc(projectSprints.sequence)).limit(1);
      const now=new Date();
      const [sprint]=await tx.insert(projectSprints).values({
        projectId:scope.project.id,
        releaseId:release.id,
        templateKey:"mentor-"+randomUUID().replaceAll("-",""),
        legacySprintKey:resolvedKey,dueLabel:input.dueLabel?.trim()||null,
        title:input.title,
        description:input.description,goal:input.goal,definitionOfDone:input.definitionOfDone,
        startDate:input.startDate,endDate:input.endDate,dueDate:input.dueDate,
        sequence:(last?.sequence??-1)+1,
        status:"PLANNED",
        updatedAt:now,
      }).returning();
      if(!sprint) throw new ProjectsServiceError("PROJECT_SPRINT_INVALID_STATE");
      await recordActivityEventInTransaction(tx,context,{
        eventType:ACTIVITY_EVENT_TYPES.PROJECTS_SPRINT_UPDATED,
        collegeId:scope.collegeId,organizationId:scope.organizationId,
        subjectType:"project_sprint",subjectId:sprint.id,
        subjectLabel:sprint.title,summary:"Project sprint created",
        metadata:{projectId:scope.project.id,sprintId:sprint.id,action:"CREATE"},
        groupKey:"project:"+scope.project.id,
        dedupeKey:"project-sprint:"+sprint.id+":created",
      });
      return sprint;
    });
  } catch(error) {
    const constraint=postgresConstraintName(error);
    if(constraint==="project_sprints_release_sequence_uq" ||
       constraint==="project_sprints_project_key_uq") {
      throw new ProjectsServiceError("PROJECT_SPRINT_INVALID_STATE");
    }
    throw error;
  }
}

/** Row-locked optimistic transitions; timestamps compare at JS millisecond precision. */
export async function transitionMentorProjectSprint(
  context:RequestContext,rawParams:unknown,rawInput:unknown,
) {
  const params=mentorSprintTransitionParamsSchema.parse(rawParams);
  const input=mentorSprintTransitionSchema.parse(rawInput);
  const scope=await mentorSprintWriteScope(context,params.projectId);
  return getDb().transaction(async tx=>{
    const [project]=await tx.select({id:projectInstances.id,status:projectInstances.status,
      deletedAt:projectInstances.deletedAt})
      .from(projectInstances)
      .where(and(eq(projectInstances.id,scope.project.id),
        eq(projectInstances.collegeId,scope.collegeId)))
      .for("update").limit(1);
    if(!project || project.deletedAt || !mentorSprintProjectWritable(project.status)) {
      throw new ProjectsServiceError("PROJECT_SPRINT_INVALID_STATE");
    }
    await assertPersistedProjectMutationActor(tx,context,scope);
    if (input.action !== "COMPLETE") {
      const [primary] = await tx.select({id:projectMembers.id}).from(projectMembers)
        .where(and(eq(projectMembers.projectId,scope.project.id),
          eq(projectMembers.role,"MENTOR"),eq(projectMembers.isPrimary,true),
          isNull(projectMembers.endedAt))).limit(1);
      if (!primary) throw new ProjectsServiceError("PROJECT_SPRINT_INVALID_STATE");
    }
    const [sprint]=await tx.select().from(projectSprints)
      .where(and(eq(projectSprints.id,params.sprintId),
        eq(projectSprints.projectId,scope.project.id),
        isNull(projectSprints.deletedAt)))
      .for("update").limit(1);
    if(!sprint) throw new ProjectsServiceError("PROJECT_SPRINT_NOT_FOUND");
    if(!isValidMentorSprintTransition(sprint.status,input.action) ||
       sprint.updatedAt.getTime()!==new Date(input.expectedUpdatedAt).getTime()) {
      throw new ProjectsServiceError("PROJECT_SPRINT_INVALID_STATE");
    }
    const [release]=await tx.select({id:projectReleases.id,status:projectReleases.status})
      .from(projectReleases)
      .where(and(eq(projectReleases.id,sprint.releaseId),
        eq(projectReleases.projectId,scope.project.id),
         isNull(projectReleases.deletedAt)))
      .for("update").limit(1);
    if(!release || release.status==="SHIPPED") {
      throw new ProjectsServiceError("PROJECT_RELEASE_INVALID_STATE");
    }
    if(input.action==="START" || input.action==="REOPEN") {
      const [active]=await tx.select({id:projectSprints.id}).from(projectSprints)
        .where(and(eq(projectSprints.projectId,scope.project.id),
          eq(projectSprints.status,"ACTIVE"),isNull(projectSprints.deletedAt),
          ne(projectSprints.id,sprint.id)))
        .limit(1);
      if(active) throw new ProjectsServiceError("PROJECT_SPRINT_ALREADY_ACTIVE");
    } else {
      const [openTask]=await tx.select({id:projectTasks.id}).from(projectTasks)
        .where(and(eq(projectTasks.projectId,scope.project.id),
          eq(projectTasks.sprintId,sprint.id),isNull(projectTasks.deletedAt),
          ne(projectTasks.status,"DONE")))
        .limit(1);
      if(!mayCloseProjectSprint(openTask ? 1 : 0))
        throw new ProjectsServiceError("PROJECT_SPRINT_HAS_OPEN_TASKS");
    }
    if(input.restoreCarry && input.action!=="REOPEN")
      throw new ProjectsServiceError("PROJECT_SPRINT_INVALID_STATE");
    let restoredTaskCount=0;
    if(input.action==="REOPEN" && input.restoreCarry){
      // Only the MOST RECENT sign-off generation can be undone, and only
      // when every task still matches the post-sign-off receipt. The project
      // row lock serializes the undo with every normal task and sprint write.
      const [signoff]=await tx.select({metadata:activityEvents.metadata})
        .from(activityEvents).where(and(
          eq(activityEvents.module,"PROJECTS"),
          eq(activityEvents.subjectType,"project_sprint"),
          eq(activityEvents.subjectId,sprint.id),
          eq(activityEvents.collegeId,scope.collegeId),
          eq(activityEvents.organizationId,scope.organizationId),
          eq(activityEvents.eventType,ACTIVITY_EVENT_TYPES.PROJECTS_SPRINT_UPDATED),
          sql`${activityEvents.metadata} ->> 'projectId' = ${scope.project.id}`,
          sql`${activityEvents.metadata} ->> 'mentorSignOffSnapshotVersion' = '1'`,
        )).orderBy(desc(activityEvents.occurredAt),desc(activityEvents.id)).limit(1);
      const signOffToken=signoff?.metadata?.["signOffToken"];
      if(typeof signOffToken!=="string")
        throw new ProjectsServiceError("PROJECT_SPRINT_INVALID_STATE");
      const [carried]=await tx.select({metadata:activityEvents.metadata})
        .from(activityEvents).where(and(
          eq(activityEvents.module,"PROJECTS"),
          eq(activityEvents.subjectType,"project_sprint"),
          eq(activityEvents.subjectId,sprint.id),
          eq(activityEvents.collegeId,scope.collegeId),
          eq(activityEvents.organizationId,scope.organizationId),
          eq(activityEvents.eventType,ACTIVITY_EVENT_TYPES.PROJECTS_SPRINT_UPDATED),
          sql`${activityEvents.metadata} ->> 'projectId' = ${scope.project.id}`,
          sql`${activityEvents.metadata} #>> '{carryUndoReceipt,signOffToken}' = ${signOffToken}`,
        )).orderBy(desc(activityEvents.occurredAt),desc(activityEvents.id)).limit(1);
      const parsed=mentorSprintCarryUndoReceiptSchema.safeParse(
        carried?.metadata?.["carryUndoReceipt"]);
      if(!parsed.success||parsed.data.signOffToken!==signOffToken||
         parsed.data.sprintId!==sprint.id)
        throw new ProjectsServiceError("PROJECT_SPRINT_INVALID_STATE");
      const all=parsed.data.tasks;
      if(all.length){
        const ids=all.map(item=>item.taskId);
        const tasks=await tx.select().from(projectTasks).where(and(
          eq(projectTasks.projectId,scope.project.id),inArray(projectTasks.id,ids),
        )).for("update");
        const sourceTasks=await tx.select({id:projectTasks.id,sequence:projectTasks.sequence})
          .from(projectTasks).where(and(
            eq(projectTasks.projectId,scope.project.id),
            eq(projectTasks.sprintId,sprint.id),
            isNull(projectTasks.deletedAt),
          )).for("update");
        const occupied=new Set(sourceTasks.map(item=>item.sequence));
        if(!mentorSprintCanUndoCarriedTasks(parsed.data,sprint.id,tasks,occupied))
          throw new ProjectsServiceError("PROJECT_SPRINT_INVALID_STATE");
        for(const item of all){
          const [updated]=await tx.update(projectTasks).set({
            sprintId:sprint.id,sequence:item.beforeSequence,
            deletedAt:null,carriedFromSprintId:item.beforeCarriedFromSprintId,
            carriedOverAt:item.beforeCarriedOverAt?
              new Date(item.beforeCarriedOverAt):null,
            updatedAt:new Date(Math.max(Date.now(),Date.parse(item.afterUpdatedAt)+1)),
            updatedByMembershipId:context.membership?.id??null,
          }).where(and(
            eq(projectTasks.id,item.taskId),eq(projectTasks.projectId,scope.project.id),
          )).returning({id:projectTasks.id});
          if(!updated)throw new ProjectsServiceError("PROJECT_SPRINT_INVALID_STATE");
        }
        restoredTaskCount=all.length;
      }
    }
    // Also reject reopening an older release when a later release has
    // already shipped; otherwise historic delivery versions become invalid.
    if(input.action==="REOPEN"){
      const [laterShipped]=await tx.select({id:projectReleases.id})
        .from(projectReleases).where(and(
          eq(projectReleases.projectId,scope.project.id),
          eq(projectReleases.status,"SHIPPED"),isNull(projectReleases.deletedAt),
          sql`${projectReleases.sequence} > (
            select source.sequence from project_releases source
              where source.id=${release.id})`,
        )).limit(1);
      if(laterShipped)throw new ProjectsServiceError("PROJECT_RELEASE_INVALID_STATE");
    }
    const status=input.action==="COMPLETE"?"COMPLETED":"ACTIVE";
    const now=new Date(Math.max(Date.now(),sprint.updatedAt.getTime()+1));
    const actorMembershipId=context.membership&&context.membership.collegeId===scope.collegeId?
      context.membership.id:null;
    const [updated]=await tx.update(projectSprints)
      .set({
        status,updatedAt:now,
        ...(input.action==="COMPLETE"?
          {completedAt:now,completedByMembershipId:actorMembershipId}:
          {startedAt:now,startedByMembershipId:actorMembershipId,
           ...(input.action==="REOPEN"?
             {completedAt:null,completedByMembershipId:null}:{})}),
      })
      .where(and(eq(projectSprints.id,sprint.id),
        eq(projectSprints.projectId,scope.project.id),
        eq(projectSprints.status,sprint.status),isNull(projectSprints.deletedAt)))
      .returning();
    if(!updated) throw new ProjectsServiceError("PROJECT_SPRINT_INVALID_STATE");
    if(input.action!=="COMPLETE") {
      await tx.update(projectReleases)
        .set({status:"IN_PROGRESS",updatedAt:now})
        .where(and(eq(projectReleases.id,release.id),
          eq(projectReleases.projectId,scope.project.id),
          ne(projectReleases.status,"SHIPPED"),
           isNull(projectReleases.deletedAt)));
      if(project.status==="PLANNED") await tx.update(projectInstances)
        .set({status:"ACTIVE",updatedAt:now})
        .where(and(eq(projectInstances.id,scope.project.id),
          eq(projectInstances.collegeId,scope.collegeId),
          eq(projectInstances.status,"PLANNED")));
    }
    await recordActivityEventInTransaction(tx,context,{
      eventType:ACTIVITY_EVENT_TYPES.PROJECTS_SPRINT_UPDATED,
      collegeId:scope.collegeId,organizationId:scope.organizationId,
      subjectType:"project_sprint",subjectId:updated.id,
      subjectLabel:updated.title,summary:input.action==="COMPLETE"?"Project sprint completed":
       input.action==="REOPEN"?"Project sprint reopened":"Project sprint started",
      metadata:{
        projectId:scope.project.id,sprintId:updated.id,
        action:input.action,from:sprint.status,to:updated.status,
        actorUserId:context.user.id,actorMembershipId,
        ...(input.action==="REOPEN"?{carryUndo:input.restoreCarry===true,
          restoredTaskCount}:{}),
        priorStartedAt:sprint.startedAt?.toISOString()??null,
        priorCompletedAt:sprint.completedAt?.toISOString()??null,
        completedAt:updated.completedAt?.toISOString()??null,
        startedAt:updated.startedAt?.toISOString()??null,
      },
      groupKey:"project:"+scope.project.id,
      dedupeKey:"project-sprint:"+updated.id+":transition:"+randomUUID(),
    });
    return {...updated,message:input.action==="COMPLETE"?"Sprint completed":
      input.action==="REOPEN"?"Sprint reopened":"Sprint started",projectStatus:input.action==="COMPLETE"?project.status:"ACTIVE"};
  });
}

/** Durable transition attribution comes from audited events rather than
 * mutable sprint creator/updater columns, and is always scoped to this college. */
export async function getMentorSprintTransitionHistory(
 context:RequestContext,rawParams:unknown,
){
 const params=mentorSprintTransitionParamsSchema.parse(rawParams);
 const scope=await mentorSprintWriteScope(context,params.projectId);
 const events=await getDb().select({
  actorUserId:activityEvents.actorUserId,actorMembershipId:activityEvents.actorMembershipId,
  occurredAt:activityEvents.occurredAt,metadata:activityEvents.metadata,
 }).from(activityEvents).where(and(
  eq(activityEvents.collegeId,scope.collegeId),
  eq(activityEvents.organizationId,scope.organizationId),
  eq(activityEvents.subjectType,"project_sprint"),
  eq(activityEvents.subjectId,params.sprintId),
  eq(activityEvents.eventType,ACTIVITY_EVENT_TYPES.PROJECTS_SPRINT_UPDATED),
 )).orderBy(desc(activityEvents.occurredAt)).limit(100);
 return events.filter(event=>["START","COMPLETE","REOPEN"].includes(String(event.metadata?.["action"])))
  .map(event=>({action:String(event.metadata?.["action"]),at:event.occurredAt,
    actorUserId:event.actorUserId,actorMembershipId:event.actorMembershipId,
    from:event.metadata?.["from"],to:event.metadata?.["to"]}));
}
