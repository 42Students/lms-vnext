import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import {
  activityEvents, collegeMemberships, colleges, membershipRoles, systemRoles, users,
} from "@/db/schema";
import { profileVerificationTpoGrants } from "@/db/schema/profile-verification";
import { isSuperAdmin, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, requirePermission } from "@/modules/permissions/policy";

const uuid = z.string().uuid();

/** Legacy TPO access is granted to active TPO admins by the college switch
 * (default on). The grant row records an explicit restriction/reinstatement,
 * and all overrides create a durable activity record. */
export async function setTpoProfileVerificationAdminGrant(
  context: RequestContext, collegeIdInput: string, membershipIdInput: string,
  enabled: boolean,
): Promise<{membershipId:string;enabled:boolean}> {
  const collegeId=uuid.parse(collegeIdInput),membershipId=uuid.parse(membershipIdInput);
  return getDb().transaction(async tx=>{
    // Same lock as the review writer: revocation and a pending review cannot
    // be committed on opposite sides of a stale permission decision.
    const [college]=await tx.select({id:colleges.id,organizationId:colleges.organizationId})
      .from(colleges).where(eq(colleges.id,collegeId)).for("update");
    if(!college) throw Error("COLLEGE_NOT_FOUND");
    requirePermission(context,"college.manage",{collegeId,organizationId:college.organizationId});
    // The HTTP session and membership grants may have been revoked since the
    // request context was constructed. Hold live user/role locks until commit;
    // the college lock alone only serializes verification settings updates.
    const [actingUser]=await tx.select({id:users.id}).from(users)
      .where(and(eq(users.id,context.user.id),
        eq(users.platformStatus,"ACTIVE"))).for("share").limit(1);
    if(!actingUser)throw new AuthorizationError("college.manage");
    if(isSuperAdmin(context)){
      const [liveSuperRole]=await tx.select({id:systemRoles.id}).from(systemRoles)
        .where(and(eq(systemRoles.userId,context.user.id),
          eq(systemRoles.role,"SUPER_ADMIN"))).for("share").limit(1);
      if(!liveSuperRole)throw new AuthorizationError("college.manage");
    }else{
      const actor=context.membership;
      if(!actor||actor.collegeId!==collegeId||actor.status!=="ACTIVE")
        throw new AuthorizationError("college.manage");
      const [liveCollegeAdmin]=await tx.select({id:collegeMemberships.id})
        .from(collegeMemberships)
        .innerJoin(membershipRoles,and(
          eq(membershipRoles.membershipId,collegeMemberships.id),
          eq(membershipRoles.role,"COLLEGE_ADMIN")))
        .where(and(eq(collegeMemberships.id,actor.id),
          eq(collegeMemberships.userId,context.user.id),
          eq(collegeMemberships.collegeId,collegeId),
          eq(collegeMemberships.status,"ACTIVE")))
        .for("share").limit(1);
      if(!liveCollegeAdmin)throw new AuthorizationError("college.manage");
    }
    const [target]=await tx.select({
      memberId:collegeMemberships.id,collegeId:collegeMemberships.collegeId,
      status:collegeMemberships.status,platformStatus:users.platformStatus,
    }).from(collegeMemberships)
      .innerJoin(users,eq(users.id,collegeMemberships.userId))
      .where(eq(collegeMemberships.id,membershipId)).for("update");
    if(!target||target.collegeId!==collegeId) throw Error("MEMBERSHIP_NOT_FOUND");
    const [tpoRole]=await tx.select({role:membershipRoles.role}).from(membershipRoles)
      .where(and(eq(membershipRoles.membershipId,membershipId),
        eq(membershipRoles.role,"TPO"))).for("share").limit(1);
    if(enabled&&(target.status!=="ACTIVE"||target.platformStatus!=="ACTIVE"||!tpoRole))
      throw Error("TPO_ADMIN_GRANT_TARGET_NOT_ACTIVE");
    if(enabled) {
      await tx.insert(profileVerificationTpoGrants).values({
        membershipId,grantedByUserId:context.user.id,
      }).onConflictDoUpdate({
        target:profileVerificationTpoGrants.membershipId,
        set:{grantedByUserId:context.user.id,grantedAt:new Date(),revokedAt:null},
      });
    } else {
      await tx.update(profileVerificationTpoGrants).set({revokedAt:new Date()})
        .where(eq(profileVerificationTpoGrants.membershipId,membershipId));
    }
    await tx.insert(activityEvents).values({
      organizationId:college.organizationId,collegeId,actorUserId:context.user.id,
      module:"PLACEMENTS",eventType:enabled ? "PROFILE_TPO_VERIFIER_GRANTED":"PROFILE_TPO_VERIFIER_REVOKED",
      subjectType:"MEMBERSHIP",subjectId:membershipId,
      summary:enabled ? "TPO profile verifier permission granted":"TPO profile verifier permission revoked",
      metadata:{enabled},
    });
    return {membershipId,enabled};
  });
}
