import "server-only";

import { and, count, desc, eq, ilike, inArray, or } from "drizzle-orm";
import { getDb } from "@/db/client";
import { projectInstances, projectTasks, projectTaskSubmissions } from "@/db/schema";
import { can } from "@/modules/permissions/policy";
import { hasActiveMembership, hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { resolveOptionalModuleAccess } from "@/modules/module-access/service";
import { ProjectsServiceError } from "./errors";
import { listMyProjectInstances } from "./member-service";
import { mentorTaskHistoryPage, mentorTaskHistoryQuerySchema } from "./mentor-task-history-model";

/** Registered task review decisions on currently assigned same-college projects only. */
export async function getMentorTaskReviewHistory(context:RequestContext,rawQuery:unknown) {
  const query=mentorTaskHistoryQuerySchema.parse(rawQuery);
  const membership=context.membership;
  if (!membership || !hasActiveMembership(context) ||
      !hasMembershipRole(context,"MENTOR") ||
      !can(context,"projects.read",{
        collegeId:membership.collegeId,organizationId:membership.organizationId,
      })) throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");

  const modules=await resolveOptionalModuleAccess(context);
  const empty=(enabled:boolean)=>({
    enabled,query,...mentorTaskHistoryPage(0,1),
    items:[] as {
      id:string;projectId:string;taskId:string;projectTitle:string;taskTitle:string;
      status:string;version:number;reviewedAt:Date|null;
    }[],
  });
  if (!modules.projects.enabled) return empty(false);
  const assigned=(await listMyProjectInstances(context)).filter(row=>
    row.memberRole==="MENTOR" && row.project.status!=="ARCHIVED");
  const ids=assigned.map(row=>row.project.id);
  if (!ids.length) return empty(true);

  const escaped=query.search.replace(/[\\%_]/g,"\\$&");
  const filters=and(
    inArray(projectTaskSubmissions.projectId,ids),
    inArray(projectTaskSubmissions.status,["APPROVED","CHANGES_REQUESTED"]),
    eq(projectInstances.collegeId,membership.collegeId),
    query.decision==="ALL" ? undefined : eq(projectTaskSubmissions.status,query.decision),
    query.priority==="ALL" ? undefined : eq(projectTasks.priority,query.priority),
    escaped ? or(
      ilike(projectTasks.title,"%"+escaped+"%"),
      ilike(projectInstances.title,"%"+escaped+"%"),
    ):undefined,
  );
  const db=getDb();
  const [summary]=await db.select({total:count()})
    .from(projectTaskSubmissions)
    .innerJoin(projectTasks,and(
      eq(projectTasks.id,projectTaskSubmissions.taskId),
      eq(projectTasks.projectId,projectTaskSubmissions.projectId),
    ))
    .innerJoin(projectInstances,eq(projectInstances.id,projectTaskSubmissions.projectId))
    .where(filters);
  const paging=mentorTaskHistoryPage(Number(summary?.total??0),query.page);
  const items=await db.select({
    id:projectTaskSubmissions.id,projectId:projectInstances.id,
    taskId:projectTasks.id,
    projectTitle:projectInstances.title,taskTitle:projectTasks.title,
    status:projectTaskSubmissions.status,version:projectTaskSubmissions.version,
    reviewedAt:projectTaskSubmissions.reviewedAt,
  }).from(projectTaskSubmissions)
    .innerJoin(projectTasks,and(
      eq(projectTasks.id,projectTaskSubmissions.taskId),
      eq(projectTasks.projectId,projectTaskSubmissions.projectId),
    ))
    .innerJoin(projectInstances,eq(projectInstances.id,projectTaskSubmissions.projectId))
    .where(filters)
    .orderBy(desc(projectTaskSubmissions.reviewedAt),desc(projectTaskSubmissions.id))
    .limit(paging.pageSize).offset((paging.page-1)*paging.pageSize);
  return {enabled:true,query,...paging,items};
}
