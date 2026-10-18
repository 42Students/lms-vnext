import "server-only";
import {and,eq,isNull} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships,membershipRoles,projectMembers,users} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {ProjectsServiceError} from "./errors";

/**
 * PROJ-BREAK-LEARNER-ACTOR-02: re-read the persisted actor/role/project grant
 * under the same transaction as the write. The request's membership and the
 * pre-transaction requireProjectReadAccess() are not sufficient when another
 * session revokes a learner or transfers them between colleges mid-request.
 */
export async function assertPersistedLearnerProjectMutation(
 tx:Pick<ReturnType<typeof getDb>,"select">,
 context:RequestContext,projectId:string,collegeId:string,
):Promise<void>{
 const member=context.membership;
 if(!member || member.status!=="ACTIVE" || member.collegeId!==collegeId ||
    context.user.platformStatus!=="ACTIVE" || !member.roles.includes("LEARNER"))
  throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
 const [persisted]=await tx.select({id:projectMembers.id})
  .from(projectMembers)
  .innerJoin(collegeMemberships,and(
   eq(collegeMemberships.id,projectMembers.membershipId),
   eq(collegeMemberships.collegeId,collegeId),
   eq(collegeMemberships.status,"ACTIVE"),
   eq(collegeMemberships.userId,context.user.id),
  ))
  .innerJoin(users,and(
   eq(users.id,collegeMemberships.userId),
   eq(users.platformStatus,"ACTIVE"),
  ))
  .innerJoin(membershipRoles,and(
   eq(membershipRoles.membershipId,collegeMemberships.id),
   eq(membershipRoles.role,"LEARNER"),
  ))
  .where(and(
   eq(projectMembers.projectId,projectId),
   eq(projectMembers.membershipId,member.id),
   eq(projectMembers.role,"LEARNER"),
   eq(projectMembers.roleKind,"LEARNER"),
   eq(projectMembers.canMutate,true),
   isNull(projectMembers.endedAt),
  ))
  .for("share").limit(1);
 if(!persisted)throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
}
