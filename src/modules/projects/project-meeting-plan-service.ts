import "server-only";

import { randomUUID } from "node:crypto";
import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { projectInstances, projectMeetings, projectSprints, projectTasks } from "@/db/schema";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import { assertPersistedPlatformPermission } from "@/modules/permissions/persisted-actor";
import type { RequestContext } from "@/modules/identity/context";
import { requireProjectManageAccess } from "./access";
import { ProjectsServiceError } from "./errors";
import { projectMeetingPlanFieldsChanged, projectMeetingPlanSchema,
 legacyMeetingSectionSaveSchema } from "./project-meeting-plan-model";
import { projectMeetingPlanToken } from "./project-meeting-plan-token";
import { isFutureProjectMeetingWindow } from "./meeting-window-policy";

/** Single atomic save of changed DRAFT meetings only. Scheduling, invitations,
 * meeting outcomes and cancellation remain in the existing lifecycle service.
 */
export async function saveProjectMeetingPlan(context: RequestContext, projectId: string, raw: unknown) {
  const input = projectMeetingPlanSchema.parse(raw);
  const scope = await requireProjectManageAccess(context, projectId);
  return getDb().transaction(async tx => {
    const [project] = await tx.select({ id: projectInstances.id, status: projectInstances.status })
      .from(projectInstances)
      .where(and(eq(projectInstances.id, scope.project.id),
        eq(projectInstances.collegeId, scope.collegeId)))
      .for("update").limit(1);
    if (!project || !["PLANNED", "ACTIVE"].includes(project.status)) {
      throw new ProjectsServiceError("PROJECT_MEETING_INVALID_STATE");
    }
    await assertPersistedPlatformPermission(tx, context, "projects.manage", {
      collegeId: scope.collegeId, organizationId: scope.organizationId,
    });

    const current = await tx.select().from(projectMeetings)
      .where(eq(projectMeetings.projectId, scope.project.id))
      .orderBy(asc(projectMeetings.id)).for("update");
    if (projectMeetingPlanToken(current) !== input.expectedMeetingsToken) {
      throw new ProjectsServiceError("PROJECT_MEETING_STALE_VERSION");
    }
    const byId = new Map(current.map(row => [row.id, row]));
    const updates = input.meetings.map(next => ({ next, prior: byId.get(next.id) }));
    if (updates.some(({ prior }) => !prior || prior.deletedAt || prior.status !== "DRAFT")) {
      throw new ProjectsServiceError("PROJECT_MEETING_INVALID_STATE");
    }
    const currentKeys=new Set<string>();
    for(const meeting of current){
      const planned=updates.find(update=>update.next.id===meeting.id);
      const key=(planned?.next.key??meeting.meetingKey??"").toLowerCase();
      if(key&&currentKeys.has(key))
        throw new ProjectsServiceError("PROJECT_MEETING_INVALID_STATE");
      if(key)currentKeys.add(key);
    }
    const changed = updates.filter(({ prior, next }) =>
      projectMeetingPlanFieldsChanged(prior!, next));
    if (!changed.length) {
      return { changed: false, meetingIds: [], meetingsToken: input.expectedMeetingsToken };
    }
    const nowMs = Date.now();
    const [sprints, tasks] = await Promise.all([
      tx.select({ id: projectSprints.id }).from(projectSprints)
        .where(eq(projectSprints.projectId, scope.project.id)),
      tx.select({ id: projectTasks.id, sprintId: projectTasks.sprintId,
        deletedAt: projectTasks.deletedAt }).from(projectTasks)
        .where(eq(projectTasks.projectId, scope.project.id)),
    ]);
    const sprintIds = new Set(sprints.map(sprint => sprint.id));
    const taskById = new Map(tasks.map(task => [task.id, task]));
    for (const { next } of changed) {
      if (!isFutureProjectMeetingWindow(new Date(next.startsAt), new Date(next.endsAt), nowMs)) {
        throw new ProjectsServiceError("PROJECT_MEETING_INVALID_STATE");
      }
      const linkedTask = next.linkedTaskId ? taskById.get(next.linkedTaskId) : null;
      if ((next.linkedSprintId && !sprintIds.has(next.linkedSprintId)) ||
        (next.linkedTaskId && (!linkedTask || linkedTask.deletedAt)) ||
        (next.linkedSprintId && linkedTask && linkedTask.sprintId !== next.linkedSprintId)) {
        throw new ProjectsServiceError("PROJECT_MEETING_LINK_INVALID");
      }
    }
    const updatedAt = new Date(Math.max(nowMs, ...current.map(row => row.updatedAt.getTime())) + 1);
    const meetingIds: string[] = [];
    for (const { prior, next } of changed) {
      const [saved] = await tx.update(projectMeetings).set({
        title:next.title,meetingKey:next.key,meetingType:next.meetingType,
        meetingUrl:next.meetingUrl,outcome:next.notes,
        agenda: next.agenda, startsAt: new Date(next.startsAt),
        endsAt: new Date(next.endsAt), linkedSprintId: next.linkedSprintId,
        linkedTaskId: next.linkedTaskId, updatedAt, version: prior!.version + 1,
      }).where(and(eq(projectMeetings.id, next.id),
        eq(projectMeetings.projectId, scope.project.id),
        eq(projectMeetings.status, "DRAFT"))).returning({ id: projectMeetings.id });
      if (!saved) throw new ProjectsServiceError("PROJECT_MEETING_STALE_VERSION");
      meetingIds.push(saved.id);
    }
    await recordActivityEventInTransaction(tx, context, {
      eventType: ACTIVITY_EVENT_TYPES.PROJECTS_MEETING_DECIDED,
      collegeId: scope.collegeId, organizationId: scope.organizationId,
      subjectType: "project", subjectId: scope.project.id,
      subjectLabel: scope.project.title, summary: "Draft meeting plan saved",
      metadata: { projectId: scope.project.id, meetingIds, status: "DRAFT", draftOnly: true },
      groupKey: "project:" + scope.project.id + ":meetings",
      dedupeKey: "project-meeting-plan:" + scope.project.id + ":" + randomUUID(),
    });
    const persisted = await tx.select().from(projectMeetings)
      .where(eq(projectMeetings.projectId, scope.project.id));
    return { changed: true, meetingIds, meetingsToken: projectMeetingPlanToken(persisted) };
  });
}

/** Atomic full-list compatibility for old RepeatingItemEditor.
 * Mutation is project/college scoped and CAS-protected. Omitted draft rows are
 * tombstoned; removed published meetings require their lifecycle commands.
 */
export async function replaceLegacyProjectMeetingDraftSection(
 context:RequestContext,projectIdInput:string,raw:unknown,
){
 const input=legacyMeetingSectionSaveSchema.parse(raw);
 const scope=await requireProjectManageAccess(context,projectIdInput);
 return getDb().transaction(async tx=>{
  const [project]=await tx.select({status:projectInstances.status,title:projectInstances.title})
   .from(projectInstances).where(and(eq(projectInstances.id,scope.project.id),
      eq(projectInstances.collegeId,scope.collegeId))).for("update").limit(1);
  if(!project||!["PLANNED","ACTIVE"].includes(project.status))
   throw new ProjectsServiceError("PROJECT_MEETING_INVALID_STATE");
  await assertPersistedPlatformPermission(tx,context,"projects.manage",{
   collegeId:scope.collegeId,organizationId:scope.organizationId,
  });
  const current=await tx.select().from(projectMeetings)
   .where(eq(projectMeetings.projectId,scope.project.id))
   .orderBy(asc(projectMeetings.id)).for("update");
  if(projectMeetingPlanToken(current)!==input.expectedMeetingsToken)
   throw new ProjectsServiceError("PROJECT_MEETING_STALE_VERSION");
  const existingByKey=new Map(current.filter(row=>row.meetingKey)
   .map(row=>[row.meetingKey!.toLowerCase(),row]));
  const rowById=new Map(current.map(row=>[row.id,row]));
  const plannedKeys=new Set(input.meetings.map(row=>row.key.toLowerCase()));
  const toRemove=current.filter(row=>row.status==="DRAFT"&&!row.deletedAt&&
    row.meetingKey&&!plannedKeys.has(row.meetingKey.toLowerCase()));
  const publishedOmitted=current.filter(row=>!row.deletedAt&&row.status!=="DRAFT"&&
    row.meetingKey&&!plannedKeys.has(row.meetingKey.toLowerCase()));
  if(publishedOmitted.length)throw new ProjectsServiceError("PROJECT_MEETING_INVALID_STATE");
  const [sprints,tasks]=await Promise.all([
   tx.select({id:projectSprints.id}).from(projectSprints)
    .where(eq(projectSprints.projectId,scope.project.id)),
   tx.select({id:projectTasks.id,sprintId:projectTasks.sprintId,
      deletedAt:projectTasks.deletedAt}).from(projectTasks)
    .where(eq(projectTasks.projectId,scope.project.id)),
  ]);
  const sprintIds=new Set(sprints.map(row=>row.id)),taskById=new Map(tasks.map(row=>[row.id,row]));
  const nowMs=Date.now(),now=new Date(Math.max(nowMs,...current.map(row=>row.updatedAt.getTime()+1)));
  const savedIds:string[]=[],changedIds:string[]=[];
  for(const next of input.meetings){
   const byKey=existingByKey.get(next.key.toLowerCase())??null;
   const before=next.id?rowById.get(next.id)??null:byKey;
   if(next.id&&(!before||before.meetingKey?.toLowerCase()!==next.key.toLowerCase())||
     before&&byKey&&before.id!==byKey.id||
     before&&before.status!=="DRAFT")
     throw new ProjectsServiceError("PROJECT_MEETING_INVALID_STATE");
   if(!isFutureProjectMeetingWindow(new Date(next.startsAt),new Date(next.endsAt),nowMs))
     throw new ProjectsServiceError("PROJECT_MEETING_INVALID_STATE");
   const task=next.linkedTaskId?taskById.get(next.linkedTaskId):null;
   if(next.linkedSprintId&&!sprintIds.has(next.linkedSprintId)||
      next.linkedTaskId&&(!task||task.deletedAt)||
      next.linkedSprintId&&task&&task.sprintId!==next.linkedSprintId)
     throw new ProjectsServiceError("PROJECT_MEETING_LINK_INVALID");
   const fields={
    meetingKey:next.key,title:next.title,meetingType:next.meetingType,
    meetingUrl:next.meetingUrl,agenda:next.agenda,
    outcome:next.notes,startsAt:new Date(next.startsAt),
    endsAt:new Date(next.endsAt),linkedSprintId:next.linkedSprintId,
    linkedTaskId:next.linkedTaskId,updatedAt:now,
   };
   if(before){
    savedIds.push(before.id);
    const changed=Boolean(before.deletedAt)||projectMeetingPlanFieldsChanged(before,next);
    if(!changed)continue;
    const [updated]=await tx.update(projectMeetings).set({
      ...fields,status:"DRAFT",deletedAt:null,deletedByWorkspace:false,
      version:before.version+1,
    }).where(and(eq(projectMeetings.id,before.id),
      eq(projectMeetings.projectId,scope.project.id))).returning({id:projectMeetings.id});
    if(!updated)throw new ProjectsServiceError("PROJECT_MEETING_STALE_VERSION");
    changedIds.push(updated.id);
   }else{
    const [created]=await tx.insert(projectMeetings).values({
      projectId:scope.project.id,...fields,status:"DRAFT",
      timeZone:"Asia/Kolkata",createdByUserId:context.user.id,
    }).returning({id:projectMeetings.id});
    if(!created)throw new ProjectsServiceError("PROJECT_MEETING_INVALID_STATE");
    savedIds.push(created.id);changedIds.push(created.id);
   }
  }
  for(const meeting of toRemove){
   const [deleted]=await tx.update(projectMeetings).set({
     deletedAt:now,deletedByWorkspace:true,updatedAt:now,version:meeting.version+1,
   }).where(and(eq(projectMeetings.id,meeting.id),
     eq(projectMeetings.projectId,scope.project.id))).returning({id:projectMeetings.id});
   if(!deleted)throw new ProjectsServiceError("PROJECT_MEETING_STALE_VERSION");
   changedIds.push(deleted.id);
  }
  if(changedIds.length)await recordActivityEventInTransaction(tx,context,{
    eventType:ACTIVITY_EVENT_TYPES.PROJECTS_MEETING_DECIDED,
    collegeId:scope.collegeId,organizationId:scope.organizationId,
    subjectType:"project",subjectId:scope.project.id,subjectLabel:project.title,
    summary:"Meeting plan updated",
    metadata:{projectId:scope.project.id,meetingIds:changedIds,
      revivedCount:input.meetings.filter(row=>
        Boolean(existingByKey.get(row.key.toLowerCase())?.deletedAt)).length,
      removedCount:toRemove.length,draftOnly:true},
    groupKey:"project:"+scope.project.id+":meetings",
  });
  const persisted=await tx.select().from(projectMeetings)
   .where(eq(projectMeetings.projectId,scope.project.id));
  return {changed:changedIds.length>0,meetingIds:savedIds,
    meetingsToken:projectMeetingPlanToken(persisted),
    removedCount:toRemove.length};
 });
}
