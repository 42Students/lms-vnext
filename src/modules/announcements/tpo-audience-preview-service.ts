import "server-only";
import {and,eq,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships,users} from "@/db/schema";
import {hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {requirePlacementManageScope} from "@/modules/placements/scope";
/**
 * Preview number of ACTIVE college memberships with an ACTIVE platform user.
 * A visibility estimate, not a recipient list, notification or delivery count.
 */
export async function previewTpoCollegeAnnouncementVisibility(context:RequestContext){
 const membership=context.membership;
 if(!membership||!hasMembershipRole(context,"TPO"))
  throw new AuthorizationError("placements.manage");
 const college=await requirePlacementManageScope(context,membership.collegeId);
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   organizationId:college.organizationId,collegeId:college.id,
  });
  const [row]=await tx.select({total:sql<number>`count(*)::integer`})
   .from(collegeMemberships)
   .innerJoin(users,eq(users.id,collegeMemberships.userId))
   .where(and(eq(collegeMemberships.collegeId,college.id),
    eq(collegeMemberships.status,"ACTIVE"),eq(users.platformStatus,"ACTIVE")));
  return {potentiallyVisibleMemberships:Number(row?.total??0),audience:"COLLEGE" as const};
 });
}
