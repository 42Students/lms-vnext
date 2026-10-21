import "server-only";
import {and,asc,eq,ilike,inArray,ne,isNull,or,sql,count} from "drizzle-orm";
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
   .from(projectInstances).where(and(eq(projectInstances.collegeId,college.id),isNull(projectInstances.deletedAt),
    ne(projectInstances.status,"ARCHIVED"),...(search?[ilike(projectInstances.title,"%"+search+"%")]:[])))
   .orderBy(asc(projectInstances.title),asc(projectInstances.id)).limit(pageSize).offset((page-1)*pageSize);
 });
}



/** Counted, tenant-scoped workspace selector; unlike the legacy first-1000
 * snapshot this is a genuine page query with a stable ID tie-break. */
export async function listCollegeReadinessWorkspaceChoicePage(
 context:RequestContext,collegeIdInput:string,
 input:{page:number;search:string},
){
 const id=z.string().uuid().parse(collegeIdInput);
 if(getProjectAdminCollegeId(context)!==id)
  throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
 const college=await loadProjectCollegeScope(id);
 requirePermission(context,"projects.manage",{
  collegeId:college.id,organizationId:college.organizationId,
 });
 const page=z.number().int().min(1).max(100000).parse(input.page);
 const search=z.string().trim().max(120).parse(input.search);
 const escaped=search.replace(/[\\%_]/g,match=>"\\"+match);
 const pattern="%"+escaped+"%";
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"projects.manage",{
   collegeId:college.id,organizationId:college.organizationId,
  });
  const filter=and(eq(projectInstances.collegeId,id),
    isNull(projectInstances.deletedAt),ne(projectInstances.status,"ARCHIVED"),
    search?or(ilike(projectInstances.title,pattern),ilike(projectInstances.slug,pattern),
      sql`${projectInstances.id}::text ilike ${pattern}`):undefined);
  const [totals]=await tx.select({n:count()}).from(projectInstances).where(filter);
  const total=Number(totals?.n??0);
  const totalPages=Math.max(1,Math.ceil(total/25));
  const currentPage=Math.min(page,totalPages);
  const items=await tx.select({id:projectInstances.id,title:projectInstances.title,
    status:projectInstances.status}).from(projectInstances).where(filter)
    .orderBy(asc(projectInstances.title),asc(projectInstances.id))
    .limit(25).offset((currentPage-1)*25);
  return {items,total,page:currentPage,pageSize:25,totalPages};
 });
}

/** Recover historic ?projectId=slug and numeric project bookmarks inside the
 * selected college only. Never resolve a foreign-college slug or leaked UUID.
 * The returned UUID is a locator, not a mutation capability.
 */
export async function resolveCollegeReadinessWorkspaceId(
 context:RequestContext,collegeIdInput:string,rawId:string,
):Promise<string|null>{
 const collegeId=z.string().uuid().parse(collegeIdInput);
 if(getProjectAdminCollegeId(context)!==collegeId)
  throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
 const college=await loadProjectCollegeScope(collegeId);
 requirePermission(context,"projects.manage",{
  collegeId,organizationId:college.organizationId,
 });
 const value=rawId.trim();
 if(value.length===0||value.length>160)return null;
 const uuid=z.string().uuid().safeParse(value);
 const legacy=/^[0-9]+$/.test(value)?Number(value):null;
 if(!uuid.success&&!/^[a-z0-9_-]+$/i.test(value))return null;
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"projects.manage",{
   collegeId,organizationId:college.organizationId,
  });
  const locator=uuid.success?eq(projectInstances.id,uuid.data):
   legacy!==null&&Number.isSafeInteger(legacy)&&legacy>0?
    or(eq(projectInstances.slug,value),eq(projectInstances.legacyProjectId,legacy)):
    eq(projectInstances.slug,value);
  const [row]=await tx.select({id:projectInstances.id})
   .from(projectInstances)
   .where(and(eq(projectInstances.collegeId,collegeId),
     isNull(projectInstances.deletedAt),locator)).limit(1);
  return row?.id??null;
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
  status:projectReleases.status,sequence:projectReleases.sequence,
  targetDate:projectReleases.targetDate})
  .from(projectReleases).where(eq(projectReleases.projectId,id)).orderBy(asc(projectReleases.sequence));
 if(!releases.length)return [];
 const ids=releases.map(r=>r.id);
 const sprints=await db.select({id:projectSprints.id,releaseId:projectSprints.releaseId,
  status:projectSprints.status}).from(projectSprints).where(and(
   eq(projectSprints.projectId,id),inArray(projectSprints.releaseId,ids)));
 const points=await db.select({
  sprintId:projectTasks.sprintId,
  committed:sql<number>`coalesce(sum(${projectTasks.estimatePoints}),0)::int`,
  completed:sql<number>`coalesce(sum(case when ${projectTasks.status}='DONE'
    then ${projectTasks.estimatePoints} else 0 end),0)::int`,
 }).from(projectTasks).where(and(eq(projectTasks.projectId,id),
     isNull(projectTasks.deletedAt)))
   .groupBy(projectTasks.sprintId);
 const bySprint=new Map(points.map(row=>[row.sprintId,row]));
 return releases.map(release=>{
  const included=sprints.filter(s=>s.releaseId===release.id);
  const committedPoints=included.reduce((sum,s)=>sum+(bySprint.get(s.id)?.committed??0),0);
  const completedPoints=included.reduce((sum,s)=>sum+(bySprint.get(s.id)?.completed??0),0);
  return {...release,sprintCount:included.length,
   completedSprints:included.filter(s=>s.status==="COMPLETED").length,
   points:committedPoints,committedPoints,completedPoints,
   targetDate:release.targetDate};
 });
 });
}
