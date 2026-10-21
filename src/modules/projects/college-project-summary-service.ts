import "server-only";
import {and,eq,isNotNull,isNull,ne} from "drizzle-orm";
import {getDb} from "@/db/client";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {projectInstances,projectMembers,projectSubmissions,projectSprints,projectTasks,sections,cohorts,programs,departments} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {ProjectsServiceError} from "./errors";
import {requireProjectManageAccess} from "./access";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {materializeCollegeProjectSummaryPatch,collegeProjectStatusChangeAllowed,collegeProjectSummaryMatchesCurrent} from "./college-project-summary-model";
import {notifyActiveProjectMembers} from "./project-notification-service";
export async function updateCollegeProjectSummary(context:RequestContext,projectId:string,raw:unknown){
 const scope=await requireProjectManageAccess(context,projectId);
 return getDb().transaction(async tx=>{
  const [row]=await tx.select().from(projectInstances)
   .where(and(eq(projectInstances.id,scope.project.id),
    eq(projectInstances.collegeId,scope.collegeId))).for("update").limit(1);
  if(!row||row.status==="ARCHIVED")throw new ProjectsServiceError("PROJECT_SUBMISSION_INVALID_STATE");
  // Re-authorize while holding the locked project row. Context is a snapshot:
  // membership/role revocation or a disabled user between request start and
  // mutation must abort both no-op retries and real writes.
  await assertPersistedPlatformPermission(tx,context,"projects.manage",{
   collegeId:scope.collegeId,organizationId:scope.organizationId,
  });
  const input=materializeCollegeProjectSummaryPatch(row,raw);
  // A completed request can be retried after its response was lost. Only
  // exact equality of *all* persisted fields is an idempotent no-op; every
  // actual change still requires the caller's original optimistic token.
  // This check must remain inside the project row lock and after the
  // archived-state gate so it cannot resurrect an archived project.
  if(collegeProjectSummaryMatchesCurrent(row,input))return row;
  if(row.title!==input.expectedTitle||row.summary!==input.expectedSummary||row.status!==input.expectedStatus||row.updatedAt.getTime()!==Date.parse(input.expectedUpdatedAt))
   throw new ProjectsServiceError("PROJECT_SUBMISSION_CONFLICT");
  // Manual progress is a legacy fallback only while there are no live tasks.
  // Once execution data exists, callers must preserve the stored fallback
  // instead of overwriting a task-derived read-side progress percentage.
  const [existingTask] = await tx.select({id:projectTasks.id}).from(projectTasks)
   .where(and(eq(projectTasks.projectId,row.id),isNull(projectTasks.deletedAt)))
   .limit(1);
  const [existingSprint] = await tx.select({id:projectSprints.id}).from(projectSprints)
   .where(and(eq(projectSprints.projectId,row.id),isNull(projectSprints.deletedAt)))
   .limit(1);
  if((existingTask || existingSprint) && input.progressPercent !== row.progressPercent)
   throw new ProjectsServiceError("PROJECT_SUBMISSION_INVALID_STATE");
  if(input.estimationUnit !== row.estimationUnit) {
   const [estimatedTask] = await tx.select({id:projectTasks.id}).from(projectTasks)
    .where(and(eq(projectTasks.projectId,row.id),isNull(projectTasks.deletedAt),
     isNotNull(projectTasks.estimatePoints))).limit(1);
   // Estimates without an explicit conversion are never silently reinterpreted.
   if(estimatedTask || (input.estimationUnit === "TASKS" && row.estimationUnit !== "TASKS"))
    throw new ProjectsServiceError("PROJECT_SUBMISSION_INVALID_STATE");
  }
  const [mentor]=await tx.select({id:projectMembers.id}).from(projectMembers)
   .where(and(eq(projectMembers.projectId,row.id),eq(projectMembers.role,"MENTOR"),
    isNull(projectMembers.endedAt))).limit(1);
  const [approved]=await tx.select({id:projectSubmissions.id}).from(projectSubmissions)
   .where(and(eq(projectSubmissions.projectId,row.id),eq(projectSubmissions.status,"APPROVED"))).limit(1);
  if(!collegeProjectStatusChangeAllowed(row.status,input.status,!!mentor,!!approved))
   throw new ProjectsServiceError("PROJECT_SUBMISSION_INVALID_STATE");
  if(input.sectionId){
    const [valid]=await tx.select({id:sections.id}).from(sections)
      .innerJoin(cohorts,eq(cohorts.id,sections.cohortId))
      .innerJoin(programs,eq(programs.id,cohorts.programId))
      .innerJoin(departments,eq(departments.id,programs.departmentId))
      .where(and(eq(sections.id,input.sectionId),
        eq(departments.collegeId,scope.collegeId),
        isNull(departments.archivedAt),eq(programs.status,"ACTIVE"),
        ne(cohorts.status,"ARCHIVED"),eq(sections.status,"ACTIVE"))).limit(1);
    if(!valid)throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  }
  const [updated]=await tx.update(projectInstances).set({
   title:input.title,summary:input.summary,status:input.status,
   progressPercent:input.progressPercent,phase:input.phase,dueLabel:input.dueLabel,
   courseLabel:input.courseLabel,sectionId:input.sectionId,blocker:input.blocker,
   nextAction:input.nextAction,startDate:input.startDate,endDate:input.endDate,
   sprintLengthWeeks:input.sprintLengthWeeks,estimationUnit:input.estimationUnit,
   updatedAt:new Date(Math.max(Date.now(),row.updatedAt.getTime()+1)),
  }).where(and(eq(projectInstances.id,row.id),eq(projectInstances.collegeId,scope.collegeId))).returning();
  if(!updated)throw new ProjectsServiceError("PROJECT_SUBMISSION_CONFLICT");
  const updatedEvent=await recordActivityEventInTransaction(tx,context,{
   eventType:ACTIVITY_EVENT_TYPES.PROJECTS_PROJECT_SUMMARY_UPDATED,
   collegeId:scope.collegeId,organizationId:scope.organizationId,
   subjectType:"project",subjectId:row.id,subjectLabel:updated.title,
   summary:"Project workspace summary updated",
   metadata:{from:{title:row.title,status:row.status,progressPercent:row.progressPercent},
    to:{title:updated.title,status:updated.status,progressPercent:updated.progressPercent},
    fields:Object.keys(raw as Record<string,unknown>).filter(key=>!key.startsWith("expected"))},
  });
  await notifyActiveProjectMembers(tx,updatedEvent.id,{
   projectId:updated.id,collegeId:scope.collegeId,roles:["LEARNER"],
   exceptUserId:context.user.id,title:"Project updated",
   body:updated.title+" has been updated.",
   actionHref:"/learn/projects/"+updated.id,
  });
  await notifyActiveProjectMembers(tx,updatedEvent.id,{
   projectId:updated.id,collegeId:scope.collegeId,roles:["MENTOR"],
   exceptUserId:context.user.id,title:"Project updated",
   body:updated.title+" has been updated.",
   actionHref:"/mentor/projects/"+updated.id,
  });
  return updated;
 });
}
