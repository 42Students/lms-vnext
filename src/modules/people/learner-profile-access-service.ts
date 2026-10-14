import "server-only";
import {and,eq} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {collegeMemberships,colleges,membershipRoles,users} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";
import {ownLearnerProfilePrincipalMatches} from "./learner-profile-access-model";
export async function requireOwnLearnerProfileAccess(context:RequestContext){
  const member=context.membership;
  if(!member)throw new AuthorizationError("profile.self.manage");
  requirePermission(context,"profile.self.manage",{collegeId:member.collegeId,organizationId:member.organizationId});
  const membershipId=z.uuid().parse(member.id);
  const [row]=await getDb().select({membershipId:collegeMemberships.id,userId:collegeMemberships.userId,
    collegeId:collegeMemberships.collegeId,organizationId:colleges.organizationId,
    status:collegeMemberships.status,platformStatus:users.platformStatus,role:membershipRoles.role,
  }).from(collegeMemberships)
    .innerJoin(colleges,eq(colleges.id,collegeMemberships.collegeId))
    .innerJoin(users,eq(users.id,collegeMemberships.userId))
    .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),eq(membershipRoles.role,"LEARNER")))
    .where(eq(collegeMemberships.id,membershipId)).limit(1);
  if(!ownLearnerProfilePrincipalMatches(context,row??null))throw new AuthorizationError("profile.self.manage");
  return member;
}
