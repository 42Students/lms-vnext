import "server-only";

import {and,eq,isNull} from "drizzle-orm";
import {projectMembers} from "@/db/schema";
import {
  assertPersistedPlatformPermission,
  type PermissionTransaction,
} from "@/modules/permissions/persisted-actor";
import type {RequestContext} from "@/modules/identity/context";
import {mayMutateProjectWithRole,type ProjectMemberRoleKind}
  from "./member-role-kind-model";
import {ProjectsServiceError} from "./errors";

/**
 * Project page access happens before transactions and can become stale when a
 * membership, user or project Mentor grant is revoked in another session.
 * Rebuild and SHARE-lock the persisted actor and assignment inside the write
 * transaction, so a revocation cannot race past the final authorization gate.
 */
export async function assertPersistedProjectMutationActor(
  tx:PermissionTransaction,
  context:RequestContext,
  scope:{
    project:{id:string};
    collegeId:string;
    organizationId:string;
    access:"ADMIN"|"MENTOR"|"LEARNER"|"OBSERVER";
  },
):Promise<void> {
  if(scope.access!=="ADMIN" && scope.access!=="MENTOR")
    throw new ProjectsServiceError("PROJECT_LIFECYCLE_ACCESS_DENIED");
  const permission=scope.access==="ADMIN"?"projects.manage":"projects.read";
  let persisted:RequestContext;
  try{
    persisted=await assertPersistedPlatformPermission(tx,context,permission,{
      collegeId:scope.collegeId,organizationId:scope.organizationId,
    });
  }catch{
    throw new ProjectsServiceError("PROJECT_LIFECYCLE_ACCESS_DENIED");
  }
  if(scope.access==="ADMIN")return;
  const membership=persisted.membership;
  if(!membership||!context.membership||
    membership.id!==context.membership.id ||
    !membership.roles.includes("MENTOR"))
    throw new ProjectsServiceError("PROJECT_LIFECYCLE_ACCESS_DENIED");
  const [member]=await tx.select({
    role:projectMembers.role,roleKind:projectMembers.roleKind,
    canMutate:projectMembers.canMutate,
  }).from(projectMembers).where(and(
    eq(projectMembers.projectId,scope.project.id),
    eq(projectMembers.membershipId,membership.id),
    eq(projectMembers.role,"MENTOR"),
    isNull(projectMembers.endedAt),
  )).for("share").limit(1);
  if(!member||member.role!=="MENTOR"||!mayMutateProjectWithRole(
    member.roleKind as ProjectMemberRoleKind,member.canMutate,
  ))throw new ProjectsServiceError("PROJECT_LIFECYCLE_ACCESS_DENIED");
}
