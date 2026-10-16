import "server-only";
import {and,eq,isNull} from "drizzle-orm";
import {getDb} from "@/db/client";
import {projectInstances,projectMembers,projectSubmissions} from "@/db/schema";
import {hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import {ProjectsServiceError} from "./errors";
import {requireProjectManageAccess} from "./access";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {collegeProjectSummaryPatch,collegeProjectStatusChangeAllowed} from "./college-project-summary-model";
export async function updateCollegeProjectSummary(context:RequestContext,projectId:string,raw:unknown){
 if(!hasMembershipRole(context,"COLLEGE_ADMIN"))
  throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
 const scope=await requireProjectManageAccess(context,projectId);
 const input=collegeProjectSummaryPatch.parse(raw);
 return getDb().transaction(async tx=>{
  const [row]=await tx.select().from(projectInstances)
   .where(and(eq(projectInstances.id,scope.project.id),
    eq(projectInstances.collegeId,scope.collegeId))).for("update").limit(1);
  if(!row||row.status==="ARCHIVED")throw new ProjectsServiceError("PROJECT_SUBMISSION_INVALID_STATE");
  if(row.title!==input.expectedTitle||row.summary!==input.expectedSummary||row.status!==input.expectedStatus)
   throw new ProjectsServiceError("PROJECT_SUBMISSION_CONFLICT");
  const [mentor]=await tx.select({id:projectMembers.id}).from(projectMembers)
   .where(and(eq(projectMembers.projectId,row.id),eq(projectMembers.role,"MENTOR"),
    isNull(projectMembers.endedAt))).limit(1);
  const [approved]=await tx.select({id:projectSubmissions.id}).from(projectSubmissions)
   .where(and(eq(projectSubmissions.projectId,row.id),eq(projectSubmissions.status,"APPROVED"))).limit(1);
  if(!collegeProjectStatusChangeAllowed(row.status,input.status,!!mentor,!!approved))
   throw new ProjectsServiceError("PROJECT_SUBMISSION_INVALID_STATE");
  if(row.title===input.title&&row.summary===input.summary&&row.status===input.status)return row;
  const [updated]=await tx.update(projectInstances).set({
   title:input.title,summary:input.summary,status:input.status,updatedAt:new Date(),
  }).where(and(eq(projectInstances.id,row.id),eq(projectInstances.collegeId,scope.collegeId))).returning();
  if(!updated)throw new ProjectsServiceError("PROJECT_SUBMISSION_CONFLICT");
  await recordActivityEventInTransaction(tx,context,{
   eventType:ACTIVITY_EVENT_TYPES.PROJECTS_PROJECT_SUMMARY_UPDATED,
   collegeId:scope.collegeId,organizationId:scope.organizationId,
   subjectType:"project",subjectId:row.id,subjectLabel:updated.title,
   summary:"Project workspace summary updated",
   metadata:{from:{title:row.title,status:row.status},to:{title:updated.title,status:updated.status}},
  });
  return updated;
 });
}
