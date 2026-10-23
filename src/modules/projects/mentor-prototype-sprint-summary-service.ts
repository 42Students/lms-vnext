import "server-only";
import {and,count,inArray,isNull,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {projectSprints} from "@/db/schema/projects";
import type {RequestContext} from "@/modules/identity/context";
import {hasActiveMembership,hasMembershipRole} from "@/modules/identity/context";
import {can} from "@/modules/permissions/policy";
import {resolveOptionalModuleAccess} from "@/modules/module-access/service";
import {ProjectsServiceError} from "./errors";
import {listMyProjectInstances} from "./member-service";

export type MentorPrototypeSprintSummary={
  total:number;
  completed:number;
  activeSequence:number|null;
};

/** Counts only real, non-deleted project sprints in the mentor's authorized
 * college/project set. This summary never assumes the prototype's sample 16
 * sprints exist in the live database. */
export async function getMentorPrototypeSprintSummaries(
 context:RequestContext,
 verifiedRows?:readonly Awaited<ReturnType<typeof listMyProjectInstances>>[number][],
):Promise<Map<string,MentorPrototypeSprintSummary>>{
 const membership=context.membership;
 if(!membership||!hasActiveMembership(context)||!hasMembershipRole(context,"MENTOR")||
    context.user.platformStatus!=="ACTIVE"||!can(context,"projects.read",{
      collegeId:membership.collegeId,organizationId:membership.organizationId,
    }))throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
 if(!(await resolveOptionalModuleAccess(context)).projects.enabled)
   throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
 const projects=(verifiedRows??await listMyProjectInstances(context))
   .filter(row=>row.memberRole==="MENTOR"&&row.project.collegeId===membership.collegeId);
 const ids=projects.map(row=>row.project.id);
 const summaries=new Map<string,MentorPrototypeSprintSummary>();
 if(!ids.length)return summaries;
 const rows=await getDb().select({
   projectId:projectSprints.projectId,
   total:count(),
   completed:sql<number>`count(*) filter (where ${projectSprints.status} = 'COMPLETED')::int`,
   activeSequence:sql<number|null>`min(${projectSprints.sequence}) filter (where ${projectSprints.status} = 'ACTIVE')::int`,
 }).from(projectSprints).where(and(
   inArray(projectSprints.projectId,ids),isNull(projectSprints.deletedAt),
 )).groupBy(projectSprints.projectId);
 for(const row of rows){
   const total=Number(row.total);
   const completed=Number(row.completed);
   summaries.set(row.projectId,{
     total,
     completed:Math.max(0,Math.min(total,completed)),
     activeSequence:row.activeSequence===null?null:Number(row.activeSequence),
   });
 }
 return summaries;
}
