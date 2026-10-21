import "server-only";
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
 targetDate:z.iso.date().nullable().optional(),
 notes:z.string().trim().max(4000).nullable().optional(),
 sortOrder:z.number().int().min(0).max(10000).optional(),
 releaseKey:z.string().trim().min(1).max(64).regex(/^[a-z0-9][a-z0-9-]*$/).optional(),
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
   const slug=(input as {title:string}).title.normalize("NFKD").replace(/[\u0300-\u036f]/g,"")
     .toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,47)||"release";
   const existingKeys=await tx.select({templateKey:projectReleases.templateKey})
     .from(projectReleases).where(eq(projectReleases.projectId,projectId));
   const keys=new Set(existingKeys.map(item=>item.templateKey));
   let templateKey="custom-"+slug,serial=2;
   while(keys.has(templateKey)){const suffix="-"+serial++;
     templateKey="custom-"+slug.slice(0,64-7-suffix.length)+suffix;}
   const write=input as z.infer<typeof body>;
   // Preserve the stable legacy releaseKey when explicitly supplied.
   if(write.releaseKey){
    if(keys.has(write.releaseKey))throw new ProjectsServiceError("PROJECT_LIFECYCLE_INVALID_STATE");
    templateKey=write.releaseKey;
   }
   const [row]=await tx.insert(projectReleases).values({
    projectId,templateKey,sequence:(last?.sequence??-1)+1,
    title:write.title,description:write.description??null,
    targetDate:write.targetDate??null,notes:write.notes??null,status:"PLANNED",
   }).returning();
   result=row??null;change="CREATED";
  }else if(operation==="PATCH"){
   if(!existing||existing.status==="SHIPPED"||
      (!input?.expectedUpdatedAt||!mentorReleaseVersionMatches(existing.updatedAt,input.expectedUpdatedAt)))
    throw new ProjectsServiceError("PROJECT_LIFECYCLE_INVALID_STATE");
   const updatedAt=nextMentorReleaseUpdateAt(existing.updatedAt,new Date());
   if(!updatedAt)throw new ProjectsServiceError("PROJECT_LIFECYCLE_INVALID_STATE");
   const write=input as z.infer<typeof body>;
   if(write.releaseKey&&write.releaseKey!==existing.templateKey){
    const [conflict]=await tx.select({id:projectReleases.id}).from(projectReleases)
     .where(and(eq(projectReleases.projectId,projectId),eq(projectReleases.templateKey,write.releaseKey)))
     .limit(1);
    if(conflict)throw new ProjectsServiceError("PROJECT_LIFECYCLE_INVALID_STATE");
    const [child]=await tx.select({id:projectSprints.id}).from(projectSprints)
     .where(and(eq(projectSprints.projectId,projectId),eq(projectSprints.releaseId,existing.id))).limit(1);
    // Once sprints reference a release key it is a stable deep-link identity.
    if(child)throw new ProjectsServiceError("PROJECT_LIFECYCLE_INVALID_STATE");
   }
   if(write.sortOrder!==undefined&&write.sortOrder!==existing.sequence){
    const ordered=await tx.select({id:projectReleases.id,sequence:projectReleases.sequence})
     .from(projectReleases).where(eq(projectReleases.projectId,projectId))
     .orderBy(projectReleases.sequence,projectReleases.id).for("update");
    const targetIndex=Math.min(write.sortOrder,ordered.length-1);
    const currentIndex=ordered.findIndex(row=>row.id===existing.id);
    if(currentIndex<0)throw new ProjectsServiceError("PROJECT_LIFECYCLE_INVALID_STATE");
    const [moving]=ordered.splice(currentIndex,1);
    ordered.splice(targetIndex,0,moving!);
    const firstTemporary=Math.max(...ordered.map(row=>row.sequence))+1;
    for(const [index,row] of ordered.entries()){
     await tx.update(projectReleases).set({sequence:firstTemporary+index})
      .where(and(eq(projectReleases.id,row.id),eq(projectReleases.projectId,projectId)));
    }
    for(const [index,row] of ordered.entries()){
     await tx.update(projectReleases).set({sequence:index})
      .where(and(eq(projectReleases.id,row.id),eq(projectReleases.projectId,projectId)));
    }
   }
   const [row]=await tx.update(projectReleases).set({
    title:write.title,description:write.description??existing.description,
    targetDate:write.targetDate===undefined?existing.targetDate:write.targetDate,
    notes:write.notes===undefined?existing.notes:write.notes,
    templateKey:write.releaseKey??existing.templateKey,
    version:sql`${projectReleases.version} + 1`,
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
   metadata:{projectId,releaseId:result.id,change,legacyVersionMapping:"UPDATED_AT_MS_CAS",releaseKey:result.templateKey,
    previousStatus:existing?.status??null,updatedStatus:change==="DELETED"?null:result.status},
   groupKey:"project:"+projectId,
  });
  return {release:result,change};
 });
}
