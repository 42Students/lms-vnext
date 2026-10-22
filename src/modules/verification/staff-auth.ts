import "server-only";
import {and,eq,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships,colleges,membershipRoles,users} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";

export class VerificationUnavailableError extends Error {
 constructor(){super("VERIFICATION_TABLES_NOT_INSTALLED");this.name="VerificationUnavailableError";}
}

/** Never authorize a queue from session claims alone: the actor must still have
 * their persisted, active COLLEGE_ADMIN membership in exactly this college. */
export async function requireCollegeVerificationActor(context:RequestContext) {
 const membership=context.membership;
 if(context.user.platformStatus!=="ACTIVE"||!membership||membership.status!=="ACTIVE"||
 !membership.roles.includes("COLLEGE_ADMIN"))throw new AuthorizationError("profile-verification.review");
 const [row]=await getDb().select({
  id:collegeMemberships.id,collegeId:collegeMemberships.collegeId,
  userId:collegeMemberships.userId,organizationId:colleges.organizationId,
 }).from(collegeMemberships)
 .innerJoin(colleges,eq(colleges.id,collegeMemberships.collegeId))
 .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),eq(membershipRoles.role,"COLLEGE_ADMIN")))
 .innerJoin(users,eq(users.id,collegeMemberships.userId))
 .where(and(eq(collegeMemberships.id,membership.id),eq(collegeMemberships.userId,context.user.id),
  eq(collegeMemberships.collegeId,membership.collegeId),
  eq(collegeMemberships.status,"ACTIVE"),eq(users.platformStatus,"ACTIVE"))).limit(1);
 if(!row||row.organizationId!==membership.organizationId)throw new AuthorizationError("profile-verification.review");
 requirePermission(context,"profile-verification.review",{collegeId:row.collegeId,organizationId:row.organizationId});
 return {collegeId:row.collegeId,organizationId:row.organizationId};
}

/** DB04 verification tables are staged. A missing migration must produce
 * an unavailable screen instead of an empty queue or a destructive fallback. */
export async function requireVerificationTables() {
 const result=await getDb().execute(sql<{records:string|null;settings:string|null;receipts:string|null}>`
  select to_regclass('public.profile_verifications')::text as records,
  to_regclass('public.profile_verification_settings')::text as settings,
  to_regclass('public.profile_private_document_receipts')::text as receipts`);
 const row=result.rows[0];
 if(!row?.["records"]||!row["settings"]||!row["receipts"])throw new VerificationUnavailableError();
}
