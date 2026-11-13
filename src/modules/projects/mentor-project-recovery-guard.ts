import "server-only";
import {can} from "@/modules/permissions/policy";
import {hasActiveMembership,hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import {resolveOptionalModuleAccess} from "@/modules/module-access/service";
import {requireProjectReadAccess} from "./access";
import {ProjectsServiceError} from "./errors";

import { ROLE } from "@/modules/identity/roles";
/** Invalid filters must not bypass the same Mentor/project boundary as valid reads. */
export async function assertMentorProjectRecoveryAccess(context:RequestContext,projectId:string) {
  const member=context.membership;
  if(!member||!hasActiveMembership(context)||!hasMembershipRole(context,ROLE.MENTOR)||
    !can(context,"projects.read",{
      collegeId:member.collegeId,organizationId:member.organizationId,
    }))throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  if(!(await resolveOptionalModuleAccess(context)).projects.enabled)
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  const scope=await requireProjectReadAccess(context,projectId);
  if(scope.access!==ROLE.MENTOR||scope.collegeId!==member.collegeId)
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
}
