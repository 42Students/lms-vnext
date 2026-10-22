import "server-only";

import {and,asc,count,eq,isNull,or,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {projectSprints,projectTasks} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireProjectReadAccess} from "./access";

/** Old workspace task-list filters mapped to one authorized project.
 * The POST command route remains independent; this page read is query-only.
 */
export const legacyProjectTaskListQuerySchema=z.object({
  lane:z.enum(["ALL","TODO","IN_PROGRESS","REVIEW","BLOCKED","DONE"]).default("ALL"),
  priority:z.enum(["ALL","LOW","MEDIUM","HIGH","CRITICAL"]).default("ALL"),
  assigneeId:z.union([z.string().uuid(),z.literal("UNASSIGNED")]).optional(),
  sprintScope:z.string().trim().min(1).max(120).default("ALL"),
  page:z.coerce.number().int().min(1).max(10000).default(1),
  size:z.coerce.number().int().min(1).max(100).default(50),
}).strict();

export async function listLegacyProjectTasks(
  context:RequestContext,projectId:string,raw:unknown,
){
  const scope=await requireProjectReadAccess(context,projectId);
  const filter=legacyProjectTaskListQuerySchema.parse(raw);
  const sprint=filter.sprintScope;
  const sprintById=z.string().uuid().safeParse(sprint);
  const sprintFilter=sprint==="ALL"?undefined:
    sprint==="BACKLOG"?isNull(projectTasks.sprintId):
    or(sprintById.success?eq(projectSprints.id,sprintById.data):undefined,
      eq(projectSprints.templateKey,sprint),
      eq(projectSprints.legacySprintKey,sprint));
  const conditions=and(
    eq(projectTasks.projectId,scope.project.id),
    isNull(projectTasks.deletedAt),
    filter.lane==="ALL"?undefined:eq(projectTasks.status,filter.lane),
    filter.priority==="ALL"?undefined:eq(projectTasks.priority,filter.priority),
    filter.assigneeId==="UNASSIGNED"?isNull(projectTasks.assigneeMembershipId):
      filter.assigneeId?eq(projectTasks.assigneeMembershipId,filter.assigneeId):undefined,
    sprintFilter,
  );
  const db=getDb();
  const [totals,rows]=await Promise.all([
    db.select({total:count()}).from(projectTasks)
      .leftJoin(projectSprints,and(eq(projectSprints.id,projectTasks.sprintId),
        eq(projectSprints.projectId,scope.project.id)))
      .where(conditions),
    db.select({
      id:projectTasks.id,title:projectTasks.title,description:projectTasks.description,
      status:projectTasks.status,priority:projectTasks.priority,
      assigneeMembershipId:projectTasks.assigneeMembershipId,
      sprintId:projectTasks.sprintId,sprintKey:projectSprints.templateKey,
      estimatePoints:projectTasks.estimatePoints,
      dueDate:projectTasks.dueDate,dueLabel:projectTasks.dueLabel,
      sequence:projectTasks.sequence,taskType:projectTasks.taskType,
      blockerReason:projectTasks.blockerReason,
      legacyTaskKey:projectTasks.legacyTaskKey,
    }).from(projectTasks)
      .leftJoin(projectSprints,and(eq(projectSprints.id,projectTasks.sprintId),
        eq(projectSprints.projectId,scope.project.id)))
      .where(conditions)
      .orderBy(sql`case when ${projectTasks.sprintId} is null then 0 else 1 end`,
        asc(projectSprints.sequence),asc(projectTasks.sequence),asc(projectTasks.id))
      .limit(filter.size).offset((filter.page-1)*filter.size),
  ]);
  return {
    message:"Project tasks loaded",projectId:scope.project.id,
    page:filter.page,pageSize:filter.size,total:Number(totals[0]?.total??0),
    items:rows,
    filters:filter,
  };
}
