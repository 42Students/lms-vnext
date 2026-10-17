import "server-only";
import {and,eq,isNull} from "drizzle-orm";
import {getDb} from "@/db/client";
import {projectInstances,projectMembers,projectSubmissions,sections,cohorts,programs,departments} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {ProjectsServiceError} from "./errors";
import {requireProjectManageAccess} from "./access";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {collegeProjectSummaryPatch,collegeProjectStatusChangeAllowed} from "./college-project-summary-model";
import {notifyActiveProjectMembers} from "./project-notification-service";
export async function updateCollegeProjectSummary(context:RequestContext,projectId:string,raw:unknown){
 const scope=await requireProjectManageAccess(context,projectId);
 if(scope.access!=="ADMIN")throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
 const input=collegeProjectSummaryPatch.parse(raw);
 return getDb().transaction(async tx=>{
  const [row]=await tx.select().from(projectInstances)
   .where(and(eq(projectInstances.id,scope.project.id),
    eq(projectInstances.collegeId,scope.collegeId))).for("update").limit(1);
  if(!row||row.status==="ARCHIVED")throw new ProjectsServiceError("PROJECT_SUBMISSION_INVALID_STATE");
  if(row.title!==input.expectedTitle||row.summary!==input.expectedSummary||row.status!==input.expectedStatus||row.updatedAt.toISOString()!==input.expectedUpdatedAt)
   throw new ProjectsServiceError("PROJECT_SUBMISSION_CONFLICT");
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
        eq(departments.collegeId,scope.collegeId),eq(sections.status,"ACTIVE"))).limit(1);
    if(!valid)throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  }
  if(row.title===input.title&&row.summary===input.summary&&row.status===input.status&&
    row.progressPercent===input.progressPercent&&row.phase===input.phase&&
    row.dueLabel===input.dueLabel&&row.courseLabel===input.courseLabel&&
    row.sectionId===input.sectionId&&row.blocker===input.blocker&&
    row.nextAction===input.nextAction&&row.startDate===input.startDate&&
    row.endDate===input.endDate&&row.sprintLengthWeeks===input.sprintLengthWeeks&&
    row.estimationUnit===input.estimationUnit)return row;
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
   metadata:{from:{title:row.title,status:row.status,progressPercent:row.progressPercent},to:{title:updated.title,status:updated.status,progressPercent:updated.progressPercent},fields:["summary","phase","dueLabel","courseLabel","sectionId","blocker","nextAction","dates","sprintLengthWeeks","estimationUnit"]},
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
