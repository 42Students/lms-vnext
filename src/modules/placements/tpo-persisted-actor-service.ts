import "server-only";
import {and,eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships,membershipRoles,users} from "@/db/schema";
import {AuthorizationError} from "@/modules/permissions/policy";
import type {RequestContext} from "@/modules/identity/context";

/** Request claims do not prove that an officer remains a persisted active TPO. */
export async function requirePersistedTpoMembership(
 context:RequestContext,collegeId:string,
){
 const membershipId=context.membership?.id;
 if(!membershipId)throw new AuthorizationError("placements.manage");
 const [actor]=await getDb().select({id:collegeMemberships.id})
  .from(collegeMemberships)
  .innerJoin(membershipRoles,and(
   eq(membershipRoles.membershipId,collegeMemberships.id),
   eq(membershipRoles.role,"TPO"),
  ))
  .innerJoin(users,and(
   eq(users.id,collegeMemberships.userId),
   eq(users.platformStatus,"ACTIVE"),
  ))
  .where(and(
   eq(collegeMemberships.id,membershipId),
   eq(collegeMemberships.collegeId,collegeId),
   eq(collegeMemberships.userId,context.user.id),
   eq(collegeMemberships.status,"ACTIVE"),
  )).limit(1);
 if(!actor)throw new AuthorizationError("placements.manage");
 return actor.id;
}
