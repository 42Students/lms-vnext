import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import {
  activityEvents, collegeMemberships, colleges, membershipRoles, users,
} from "@/db/schema";
import { profileVerificationTpoGrants } from "@/db/schema/profile-verification";
import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";

const uuid = z.string().uuid();

/** Admin-controlled delegated verification rights. Simply holding the TPO role
 * never suffices: membership must be explicitly granted and not revoked.
 * All grant/revoke operations create a durable activity record.
 */
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
    const [target]=await tx.select({
      memberId:collegeMemberships.id,collegeId:collegeMemberships.collegeId,
      status:collegeMemberships.status,platformStatus:users.platformStatus,
    }).from(collegeMemberships)
      .innerJoin(users,eq(users.id,collegeMemberships.userId))
      .where(eq(collegeMemberships.id,membershipId)).for("update");
    if(!target||target.collegeId!==collegeId) throw Error("MEMBERSHIP_NOT_FOUND");
    const [tpoRole]=await tx.select({role:membershipRoles.role}).from(membershipRoles)
      .where(and(eq(membershipRoles.membershipId,membershipId),
        eq(membershipRoles.role,"TPO"))).limit(1);
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
