import "server-only";
import {and,count,eq,isNull} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {colleges,projectInstances,projectMembers,placementJobs,placementApplications,placementOffers} from "@/db/schema";
import {isSuperAdmin,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";
const id=z.uuid();
export function moduleDisableImpactSummary(module:"projects"|"placements"|"electives",counts:number[]){
 if(module==="projects")return `Projects: ${counts[0]} active primary-mentor assignments may lose access. This is not a safety check.`;
 if(module==="placements")return `Placements: ${counts[0]} active drives, ${counts[1]} in-progress applications and ${counts[2]} pending offers may be affected. Existing data is retained.`;
 return "Electives: access changes may affect learner choices. No deletion is performed.";
}
export async function readModuleDisableImpact(ctx:RequestContext,collegeRaw:string,moduleRaw:string){
 if(!isSuperAdmin(ctx))throw new AuthorizationError("admin-scope.select");
 requirePermission(ctx,"admin-scope.select");
 const collegeId=id.parse(collegeRaw),module=z.enum(["projects","placements","electives"]).parse(moduleRaw);
 const [college]=await getDb().select({id:colleges.id,organizationId:colleges.organizationId}).from(colleges)
  .where(and(eq(colleges.id,collegeId),eq(colleges.status,"ACTIVE"))).limit(1);
 if(!college)throw new AuthorizationError("college.read");
 requirePermission(ctx,"college.read",{collegeId,organizationId:college.organizationId});
 const db=getDb();
 if(module==="projects"){
  const [row]=await db.select({total:count()}).from(projectMembers)
   .innerJoin(projectInstances,eq(projectInstances.id,projectMembers.projectId))
   .where(and(eq(projectInstances.collegeId,collegeId),eq(projectInstances.status,"ACTIVE"),
     eq(projectMembers.role,"MENTOR"),eq(projectMembers.isPrimary,true),isNull(projectMembers.endedAt)));
  const counts=[row?.total??0];
  return {module,counts,summary:moduleDisableImpactSummary(module,counts)};
 }
 if(module==="placements"){
  const [drives,applications,offers]=await Promise.all([
   db.select({total:count()}).from(placementJobs)
    .where(and(eq(placementJobs.collegeId,collegeId),eq(placementJobs.status,"PUBLISHED"))),
   db.select({total:count()}).from(placementApplications)
    .innerJoin(placementJobs,eq(placementJobs.id,placementApplications.jobId))
    .where(and(eq(placementJobs.collegeId,collegeId),eq(placementApplications.status,"SUBMITTED"))),
   db.select({total:count()}).from(placementOffers)
    .innerJoin(placementApplications,eq(placementApplications.id,placementOffers.applicationId))
    .innerJoin(placementJobs,eq(placementJobs.id,placementApplications.jobId))
    .where(and(eq(placementJobs.collegeId,collegeId),eq(placementOffers.status,"ISSUED"))),
  ]);
  const counts=[drives[0]?.total??0,applications[0]?.total??0,offers[0]?.total??0];
  return {module,counts,summary:moduleDisableImpactSummary(module,counts)};
 }
 return {module,counts:[],summary:moduleDisableImpactSummary(module,[])};
}
