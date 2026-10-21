import "server-only";
import {randomUUID} from "node:crypto";
import {and,desc,eq,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {projectInstances,projectReleases,projectSprints} from "@/db/schema";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import type {RequestContext} from "@/modules/identity/context";
import {requireProjectLifecycleMutationAccess} from "./access";
import {assertPersistedProjectMutationActor} from "./persisted-mentor-mutation";
import {ProjectsServiceError} from "./errors";
import {mentorReleaseDeleteSchema,mentorReleaseVersionMatches,nextMentorReleaseUpdateAt} from "./mentor-release-version-model";

const uuid=z.string().uuid();
const body=z.strictObject({
 title:z.string().trim().min(1).max(220),
 description:z.string().trim().max(4000).nullable().optional(),
 /** A release target is a calendar day, never a client-local timestamp. */
 targetDate:z.iso.date().nullable().optional(),
 expectedUpdatedAt:z.iso.datetime({offset:true}).optional(),
});
type Mode="CREATED"|"UPDATED"|"DELETED";
export async function writeMentorProjectRelease(
 context:RequestContext,projectIdInput:string,releaseIdInput:string|null,
 operation:"POST"|"PATCH"|"DELETE",raw:unknown,
){
 const projectId=uuid.parse(projectIdInput);
 const scope=await requireProjectLifecycleMutationAccess(context,projectId);
 const releaseId=releaseIdInput?uuid.parse(releaseIdInput):null;
 const input=operation==="DELETE"?mentorReleaseDeleteSchema.parse(raw):body.parse(raw);
 return getDb().transaction(async tx=>{
  const [project]=await tx.select({status:projectInstances.status}).from(projectInstances)
   .where(and(eq(projectInstances.id,projectId),eq(projectInstances.collegeId,scope.collegeId)))
   .for("update").limit(1);
  if(!project||project.status!=="ACTIVE"&&project.status!=="PLANNED")
   throw new ProjectsServiceError("PROJECT_LIFECYCLE_INVALID_STATE");
  // Prevent a stale tab from publishing release changes after Mentor grant revocation.
  await assertPersistedProjectMutationActor(tx,context,scope);
  const [existing]=releaseId?await tx.select().from(projectReleases).where(and(
   eq(projectReleases.id,releaseId),eq(projectReleases.projectId,projectId)
  )).for("update").limit(1):[null];
  if(releaseId&&!existing)throw new ProjectsServiceError("PROJECT_RELEASE_NOT_FOUND");
  let change:Mode;
  let result:typeof projectReleases.$inferSelect|null=null;
  if(operation==="POST"){
   const [last]=await tx.select({sequence:projectReleases.sequence}).from(projectReleases)
    .where(eq(projectReleases.projectId,projectId)).orderBy(desc(projectReleases.sequence)).limit(1);
   const [row]=await tx.insert(projectReleases).values({
    projectId,templateKey:"custom-"+randomUUID(),sequence:(last?.sequence??-1)+1,
    title:(input as {title:string;description?:string|null;targetDate?:string|null}).title,
    description:(input as {description?:string|null}).description??null,
    targetDate:(input as {targetDate?:string|null}).targetDate??null,status:"PLANNED",
   }).returning();
   result=row??null;change="CREATED";
  }else if(operation==="PATCH"){
   if(!existing||existing.status==="SHIPPED"||
      (!input?.expectedUpdatedAt||!mentorReleaseVersionMatches(existing.updatedAt,input.expectedUpdatedAt)))
    throw new ProjectsServiceError("PROJECT_LIFECYCLE_INVALID_STATE");
   const updatedAt=nextMentorReleaseUpdateAt(existing.updatedAt,new Date());
   if(!updatedAt)throw new ProjectsServiceError("PROJECT_LIFECYCLE_INVALID_STATE");
   const [row]=await tx.update(projectReleases).set({
    title:(input as {title:string;description?:string|null}).title,
    description:(input as {description?:string|null}).description??null,
    ...((input as {targetDate?:string|null}).targetDate!==undefined
      ?{targetDate:(input as {targetDate?:string|null}).targetDate}:{}),
    updatedAt,
   }).where(and(eq(projectReleases.id,existing.id),eq(projectReleases.projectId,projectId))).returning();
   result=row??null;change="UPDATED";
  }else{
   if(!existing||existing.status==="SHIPPED"||
      !mentorReleaseVersionMatches(existing.updatedAt,input.expectedUpdatedAt!))
    throw new ProjectsServiceError("PROJECT_LIFECYCLE_INVALID_STATE");
   const [sprint]=await tx.select({id:projectSprints.id}).from(projectSprints)
    .where(and(eq(projectSprints.projectId,projectId),eq(projectSprints.releaseId,existing.id))).limit(1);
   if(sprint)throw new ProjectsServiceError("PROJECT_LIFECYCLE_INVALID_STATE");
   await tx.delete(projectReleases).where(and(eq(projectReleases.id,existing.id),
    eq(projectReleases.projectId,projectId)));
   result=existing;change="DELETED";
  }
  if(!result)throw new ProjectsServiceError("PROJECT_LIFECYCLE_INVALID_STATE");
  await recordActivityEventInTransaction(tx,context,{
   eventType:change==="CREATED"?ACTIVITY_EVENT_TYPES.PROJECTS_RELEASE_CREATED:
    change==="UPDATED"?ACTIVITY_EVENT_TYPES.PROJECTS_RELEASE_UPDATED:
    ACTIVITY_EVENT_TYPES.PROJECTS_RELEASE_DELETED,
   collegeId:scope.collegeId,organizationId:scope.organizationId,
   subjectType:"project_release",subjectId:result.id,subjectLabel:result.title,
   summary:"Project release "+change.toLowerCase(),
   metadata:{projectId,releaseId:result.id,change,
    previousStatus:existing?.status??null,updatedStatus:change==="DELETED"?null:result.status},
   groupKey:"project:"+projectId,
  });
  return {release:result,change};
 });
}
