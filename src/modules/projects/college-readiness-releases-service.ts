import "server-only";
import {and,asc,eq,ilike,inArray,ne,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {projectInstances,projectReleases,projectSprints,projectTasks} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requirePermission} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {getProjectAdminCollegeId} from "./admin-college-scope";
import {ProjectsServiceError} from "./errors";
import {loadProjectCollegeScope} from "./scope";

export async function listCollegeReadinessWorkspaceChoices(context:RequestContext,collegeId:string,options:{page?:number;pageSize?:number;search?:string}={}){
 const id=z.string().uuid().parse(collegeId);
 if(getProjectAdminCollegeId(context)!==id)
  throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
 const college=await loadProjectCollegeScope(id);
 requirePermission(context,"projects.manage",{organizationId:college.organizationId,collegeId:college.id});
 const page=z.number().int().min(1).max(100000).parse(options.page??1);
 const pageSize=z.number().int().min(1).max(1000).parse(options.pageSize??1000);
 const search=z.string().trim().max(160).parse(options.search??"");
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"projects.manage",{
   organizationId:college.organizationId,collegeId:college.id,
  });
  return tx.select({id:projectInstances.id,title:projectInstances.title,status:projectInstances.status})
   .from(projectInstances).where(and(eq(projectInstances.collegeId,college.id),ne(projectInstances.status,"ARCHIVED"),...(search?[ilike(projectInstances.title,"%"+search+"%")]:[])))
   .orderBy(asc(projectInstances.title),asc(projectInstances.id)).limit(pageSize).offset((page-1)*pageSize);
 });
}

/** COL-projects-12: release readiness is derived from registered sprint/task data. */
export async function listCollegeReadinessReleases(context:RequestContext,collegeId:string,projectId:string){
 const requestedCollegeId=z.string().uuid().parse(collegeId);
 const id=z.string().uuid().parse(projectId);
 if(getProjectAdminCollegeId(context)!==requestedCollegeId)
  throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
 const college=await loadProjectCollegeScope(requestedCollegeId);
 requirePermission(context,"projects.manage",{organizationId:college.organizationId,collegeId:college.id});
 // The live actor and project are held under SHARE locks until all derived
 // readiness rows are read; archive and role revocation must not race them.
 return getDb().transaction(async db=>{
  await assertPersistedPlatformPermission(db,context,"projects.manage",{
   organizationId:college.organizationId,collegeId:college.id,
  });
  const [owned]=await db.select({id:projectInstances.id}).from(projectInstances)
   .where(and(eq(projectInstances.id,id),eq(projectInstances.collegeId,college.id),
    ne(projectInstances.status,"ARCHIVED"))).for("share").limit(1);
  if(!owned)return [];
 const releases=await db.select({id:projectReleases.id,title:projectReleases.title,
  status:projectReleases.status,sequence:projectReleases.sequence})
  .from(projectReleases).where(eq(projectReleases.projectId,id)).orderBy(asc(projectReleases.sequence));
 if(!releases.length)return [];
 const ids=releases.map(r=>r.id);
 const sprints=await db.select({id:projectSprints.id,releaseId:projectSprints.releaseId,
  status:projectSprints.status}).from(projectSprints).where(and(
   eq(projectSprints.projectId,id),inArray(projectSprints.releaseId,ids)));
 const points=await db.select({sprintId:projectTasks.sprintId,points:sql<number>`coalesce(sum(${projectTasks.estimatePoints}),0)::int`})
  .from(projectTasks).where(eq(projectTasks.projectId,id)).groupBy(projectTasks.sprintId);
 const bySprint=new Map(points.map(row=>[row.sprintId,row.points]));
 return releases.map(release=>{
  const included=sprints.filter(s=>s.releaseId===release.id);
  return {...release,sprintCount:included.length,
   completedSprints:included.filter(s=>s.status==="COMPLETED").length,
   points:included.reduce((sum,s)=>sum+(bySprint.get(s.id)??0),0),
   targetDate:null as string|null};
 });
 });
}
