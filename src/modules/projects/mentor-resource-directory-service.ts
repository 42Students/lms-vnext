import "server-only";
import {hasActiveMembership,hasMembershipRole,type RequestContext}
 from "@/modules/identity/context";
import {can} from "@/modules/permissions/policy";
import {resolveOptionalModuleAccess} from "@/modules/module-access/service";
import {listProjectResources} from "./resource-service";
import {requireProjectReadAccess} from "./access";
import {ProjectsServiceError} from "./errors";
import {mentorResourceDirectory,mentorResourceDirectoryQuerySchema}
 from "./mentor-resource-directory-model";
/** Metadata-only scoped resource directory: no blob/storage reads or writes. */
export async function getMentorResourceDirectory(context:RequestContext,raw:unknown){
 const query=mentorResourceDirectoryQuerySchema.parse(raw);
 const membership=context.membership;
 if(!membership||!hasActiveMembership(context)||!hasMembershipRole(context,"MENTOR")||
  !can(context,"projects.read",{
   collegeId:membership.collegeId,organizationId:membership.organizationId,
  }))throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
 // Disabled Projects cannot reveal project identity through resource metadata.
 const enabled=(await resolveOptionalModuleAccess(context)).projects.enabled;
 if(!enabled)return {enabled:false as const,query,projectTitle:"",
  ...mentorResourceDirectory([],query)};
 const scope=await requireProjectReadAccess(context,query.projectId);
 if(scope.access!=="MENTOR"||scope.collegeId!==membership.collegeId)
  throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
 const resources=await listProjectResources(context,scope.project.id);
 return {enabled:true as const,query,projectTitle:scope.project.title,
  ...mentorResourceDirectory(resources,query)};
}
