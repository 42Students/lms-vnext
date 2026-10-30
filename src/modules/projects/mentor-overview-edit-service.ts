import "server-only";
import {and,eq,isNull} from "drizzle-orm";
import {getDb} from "@/db/client";
import {projectInstances} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireProjectLifecycleMutationAccess} from "./access";
import {assertPersistedProjectMutationActor} from "./persisted-mentor-mutation";
import {ProjectsServiceError} from "./errors";
import {mentorOverviewEditSchema} from "./mentor-overview-edit-model";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {notifyActiveProjectMembers} from "./project-notification-service";
export async function updateMentorProjectOverview(context:RequestContext,projectId:string,raw:unknown){
 const input=mentorOverviewEditSchema.parse(raw);
 const scope=await requireProjectLifecycleMutationAccess(context,projectId);
 return getDb().transaction(async tx=>{
  const [current]=await tx.select().from(projectInstances)
   .where(and(eq(projectInstances.id,scope.project.id),eq(projectInstances.collegeId,scope.collegeId),
    isNull(projectInstances.deletedAt)))
   .for("update").limit(1);
  if(!current||current.status==="ARCHIVED"||current.status==="COMPLETED")
   throw new ProjectsServiceError("PROJECT_SUBMISSION_INVALID_STATE");
  await assertPersistedProjectMutationActor(tx,context,scope);
  if(current.updatedAt.getTime()!==Date.parse(input.expectedUpdatedAt))
   throw new ProjectsServiceError("PROJECT_SUBMISSION_CONFLICT");
  if(current.summary===input.summary&&current.dueLabel===input.dueLabel&&
      current.blocker===input.blocker&&current.nextAction===input.nextAction)return current;
  const [updated]=await tx.update(projectInstances).set({
   summary:input.summary,dueLabel:input.dueLabel,blocker:input.blocker,
   nextAction:input.nextAction,
   updatedAt:new Date(Math.max(Date.now(),current.updatedAt.getTime()+1)),
  }).where(and(eq(projectInstances.id,current.id),eq(projectInstances.collegeId,scope.collegeId),
    isNull(projectInstances.deletedAt))).returning();
  if(!updated)throw new ProjectsServiceError("PROJECT_SUBMISSION_CONFLICT");
  const event=await recordActivityEventInTransaction(tx,context,{
   eventType:ACTIVITY_EVENT_TYPES.PROJECTS_PROJECT_SUMMARY_UPDATED,
   collegeId:scope.collegeId,organizationId:scope.organizationId,
   subjectType:"project",subjectId:updated.id,subjectLabel:updated.title,
   summary:"Mentor updated project overview",
   metadata:{fields:["summary","dueLabel","blocker","nextAction"],previousVersion:current.updatedAt.toISOString()},
   groupKey:"project:"+updated.id,
  });
  await notifyActiveProjectMembers(tx,event.id,{
   projectId:updated.id,collegeId:scope.collegeId,roles:["LEARNER"],
   exceptUserId:context.user.id,title:"Project updated",
   body:updated.title+" — project overview updated.",
   actionHref:"/learn/projects/"+updated.id+"?tab=overview",
  });
  return updated;
 });
}
