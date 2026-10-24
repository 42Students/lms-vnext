import "server-only";
import {and,asc,eq,inArray,isNull} from "drizzle-orm";
import {getDb} from "@/db/client";
import {projectSprints,projectReleases} from "@/db/schema/projects";
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
  segments:readonly {sequence:number;releaseSequence:number;status:string}[];
};

/** Use the project-wide position for "Sprint n of total".
 * The persisted sprint.sequence is release-local and may restart at zero.
 */
export function summarizeMentorProjectSprints(rows:readonly {
  id:string;projectId:string;sequence:number;releaseSequence:number;status:string;
}[]):Map<string,MentorPrototypeSprintSummary>{
 const ordered=[...rows].sort((a,b)=>
   a.projectId.localeCompare(b.projectId)||
   a.releaseSequence-b.releaseSequence||a.sequence-b.sequence||
   a.id.localeCompare(b.id));
 const grouped=new Map<string,Array<{sequence:number;releaseSequence:number;status:string}>>();
 for(const row of ordered){
  const found=grouped.get(row.projectId)??[];
  found.push({sequence:row.sequence,releaseSequence:row.releaseSequence,status:row.status});
  grouped.set(row.projectId,found);
 }
 const results=new Map<string,MentorPrototypeSprintSummary>();
 for(const [projectId,segments] of grouped){
  const activeIndex=segments.findIndex(item=>item.status==="ACTIVE");
  results.set(projectId,{
   total:segments.length,
   completed:segments.filter(item=>item.status==="COMPLETED").length,
   activeSequence:activeIndex>=0?activeIndex+1:null,
   segments,
  });
 }
 return results;
}

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
 if(!ids.length)return new Map<string,MentorPrototypeSprintSummary>();
 const rows=await getDb().select({
   id:projectSprints.id,
   projectId:projectSprints.projectId,
   sequence:projectSprints.sequence,
   releaseSequence:projectReleases.sequence,
   status:projectSprints.status,
 }).from(projectSprints)
 .innerJoin(projectReleases,and(
   eq(projectReleases.id,projectSprints.releaseId),
   eq(projectReleases.projectId,projectSprints.projectId),
 ))
 .where(and(
   inArray(projectSprints.projectId,ids),
   isNull(projectSprints.deletedAt),isNull(projectReleases.deletedAt),
 )).orderBy(projectSprints.projectId,asc(projectReleases.sequence),
   asc(projectSprints.sequence),asc(projectSprints.id));
 return summarizeMentorProjectSprints(rows);
}
