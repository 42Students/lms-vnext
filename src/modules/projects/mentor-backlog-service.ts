import "server-only";
import { randomUUID } from "node:crypto";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { projectInstances, projectTasks, projectSprints, projectReleases } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requireProjectLifecycleMutationAccess } from "./access";
import { assertPersistedProjectMutationActor } from "./persisted-mentor-mutation";
import { ProjectsServiceError } from "./errors";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";

const paramsSchema = z.strictObject({
  taskId: z.string().uuid(),
  targetSprintId: z.string().uuid().nullable(),
  expectedUpdatedAt: z.iso.datetime({ offset: true }),
});
const backlogCreateSchema = z.strictObject({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(4000).nullable().default(null),
  approach: z.string().trim().max(4000).nullable().default(null),
  acceptanceCriteria: z.string().trim().max(4000).nullable().default(null),
  priority: z.enum(["LOW","MEDIUM","HIGH","CRITICAL"]).default("MEDIUM"),
  estimatePoints: z.number().int().min(0).max(1000).nullable().default(null),
  taskType: z.enum(["STORY","BUG","CHORE","SPIKE"]).nullable().default(null),
  dueDate: z.iso.date().nullable().default(null),
  blockerReason: z.string().trim().max(4000).nullable().default(null),
});
/** MEN-projects-meetings-36: migration 0110 is registered and the ORM is authoritative. */
export async function moveMentorBacklogTask(context: RequestContext, projectIdInput: string, raw: unknown) {
  const input = paramsSchema.parse(raw);
  const scope = await requireProjectLifecycleMutationAccess(context, projectIdInput);
  return getDb().transaction(async tx => {
    const [project] = await tx.select({ status: projectInstances.status }).from(projectInstances)
      .where(and(eq(projectInstances.id, scope.project.id),eq(projectInstances.collegeId, scope.collegeId)))
      .for("update").limit(1);
    await assertPersistedProjectMutationActor(tx,context,scope);
    if(project?.status !== "ACTIVE")throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
    const [task] = await tx.select().from(projectTasks)
      .where(and(eq(projectTasks.projectId,scope.project.id),eq(projectTasks.id,input.taskId)))
      .for("update").limit(1);
    if(!task || ["DONE","IN_REVIEW"].includes(task.status) ||
      task.updatedAt.getTime() !== Date.parse(input.expectedUpdatedAt) ||
      task.sprintId === input.targetSprintId)throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
    if(input.targetSprintId){
      const [sprint] = await tx.select().from(projectSprints)
        .where(and(eq(projectSprints.id,input.targetSprintId),eq(projectSprints.projectId,scope.project.id)))
        .for("update").limit(1);
      if(!sprint || sprint.status === "COMPLETED")throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
      const [release] = await tx.select({status:projectReleases.status}).from(projectReleases)
        .where(and(eq(projectReleases.id,sprint.releaseId),eq(projectReleases.projectId,scope.project.id),
           isNull(projectReleases.deletedAt))).limit(1);
      if(!release || release.status === "SHIPPED")throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
    }
    // A project row lock serializes tail allocation. Legacy sortOrder is
    // preserved as provenance; sequence is the live sprint-local order.
    // updatedAt carries an exact millisecond CAS token (legacy used @Version).
    const [last] = await tx.select({sequence:projectTasks.sequence}).from(projectTasks)
      .where(and(eq(projectTasks.projectId,scope.project.id),
        input.targetSprintId ? eq(projectTasks.sprintId,input.targetSprintId) : isNull(projectTasks.sprintId)))
      .orderBy(desc(projectTasks.sequence)).limit(1);
    const now = new Date(Math.max(Date.now(),task.updatedAt.getTime()+1));
    const [updated] = await tx.update(projectTasks).set({
      sprintId:input.targetSprintId,
      sequence:(last?.sequence??-1)+1,
      // Any direct sprint-to-sprint move is real carry-over, not just a
      // reordered task. Backlog -> sprint retains its recorded previous sprint.
      carriedFromSprintId:task.sprintId??task.carriedFromSprintId,
      carriedOverAt:task.sprintId?now:task.carriedOverAt,
      updatedAt:now,
    }).where(and(eq(projectTasks.id,task.id),eq(projectTasks.projectId,scope.project.id),
      sql`date_trunc('milliseconds', ${projectTasks.updatedAt}) = ${task.updatedAt.toISOString()}::timestamptz`)).returning();
    if(!updated)throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
    await recordActivityEventInTransaction(tx,context,{
      eventType:ACTIVITY_EVENT_TYPES.PROJECTS_TASK_DETAILS_UPDATED,
      collegeId:scope.collegeId,organizationId:scope.organizationId,
      subjectType:"project_task",subjectId:task.id,subjectLabel:task.title,
      summary:input.targetSprintId?"Task pulled into sprint":"Task returned to product backlog",
      metadata:{projectId:scope.project.id,taskId:task.id,fromSprintId:task.sprintId,
        targetSprintId:input.targetSprintId},groupKey:"project:"+scope.project.id,
    });
    return {task:updated, taskId:task.id,targetSprintId:input.targetSprintId};
  });
}
export async function createMentorBacklogTask(context: RequestContext, projectIdInput: string, raw: unknown) {
  const input = backlogCreateSchema.parse(raw);
  const scope = await requireProjectLifecycleMutationAccess(context,projectIdInput);
  return getDb().transaction(async tx => {
    const [project] = await tx.select({status:projectInstances.status}).from(projectInstances)
      .where(and(eq(projectInstances.id,scope.project.id),eq(projectInstances.collegeId,scope.collegeId)))
      .for("update").limit(1);
    await assertPersistedProjectMutationActor(tx,context,scope);
    if(!project || !["PLANNED","ACTIVE"].includes(project.status))
      throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
    const [last] = await tx.select({sequence:projectTasks.sequence}).from(projectTasks)
      .where(and(eq(projectTasks.projectId,scope.project.id),isNull(projectTasks.sprintId)))
      .orderBy(desc(projectTasks.sequence)).limit(1);
    const [task] = await tx.insert(projectTasks).values({
      projectId:scope.project.id,sprintId:null,
      templateKey:"backlog-"+randomUUID().replaceAll("-",""),
      sequence:(last?.sequence??-1)+1,title:input.title,description:input.description,
      approach:input.approach,
      acceptanceCriteria:input.acceptanceCriteria,priority:input.priority,status:"TODO",
      estimatePoints:input.estimatePoints,
      taskType:input.taskType??"STORY",dueDate:input.dueDate,blockerReason:input.blockerReason,
    }).returning();
    if(!task)throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
    await recordActivityEventInTransaction(tx,context,{
      eventType:ACTIVITY_EVENT_TYPES.PROJECTS_TASK_CREATED,
      collegeId:scope.collegeId,organizationId:scope.organizationId,
      subjectType:"project_task",subjectId:task.id,subjectLabel:task.title,
      summary:"Product backlog task created",
      metadata:{projectId:scope.project.id,taskId:task.id,backlog:true,
        taskType:task.taskType,dueDate:task.dueDate},
      groupKey:"project:"+scope.project.id,
    });
    return task;
  });
}

/** Deterministic import mapping for legacy global sortOrder. Each sprint
 * and product backlog receives dense zero-based sequence numbers. Repeated
 * positions sort by stable IDs; a missing position comes last. This is for
 * importer use only, never to renumber an actively edited sprint. */
export function planImportedProjectTaskSequences<T extends {
 id:string;projectId:string;sprintId:string|null;legacySortOrder:number|null;
}>(rows:readonly T[]):Array<{id:string;projectId:string;sprintId:string|null;sequence:number}>{
 const groups=new Map<string,T[]>();
 for(const row of rows){
  const key=row.projectId+":"+(row.sprintId??"backlog");
  const group=groups.get(key)??[];
  group.push(row);groups.set(key,group);
 }
 const result:Array<{id:string;projectId:string;sprintId:string|null;sequence:number}>=[];
 for(const group of groups.values()){
  group.sort((a,b)=>(a.legacySortOrder??Number.MAX_SAFE_INTEGER)-
   (b.legacySortOrder??Number.MAX_SAFE_INTEGER)||a.id.localeCompare(b.id));
  for(const [sequence,row] of group.entries())result.push({id:row.id,
   projectId:row.projectId,sprintId:row.sprintId,sequence});
 }
 return result;
}
