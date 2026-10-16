import "server-only";
import {and,eq,isNull} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships,colleges,membershipRoles,users} from "@/db/schema";
import {profileVerificationSettings,profileVerificationTpoGrants} from "@/db/schema/profile-verification";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";
import {effectiveTpoVerifierSetting} from "./switch-state";
import {requireVerificationTables} from "./staff-auth";

/** Never trust a session role, client college ID, or grant flag for private documents. */
export async function requireTpoVerificationActor(context:RequestContext){
 const membership=context.membership;
 if(context.user.platformStatus!=="ACTIVE"||!membership||membership.status!=="ACTIVE"||
  !membership.roles.includes("TPO"))throw new AuthorizationError("profile-verification.review");
 await requireVerificationTables();
 const [actor]=await getDb().select({
  id:collegeMemberships.id,collegeId:collegeMemberships.collegeId,
  organizationId:colleges.organizationId,
 }).from(collegeMemberships)
 .innerJoin(colleges,eq(colleges.id,collegeMemberships.collegeId))
 .innerJoin(users,eq(users.id,collegeMemberships.userId))
 .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),eq(membershipRoles.role,"TPO")))
 .where(and(eq(collegeMemberships.id,membership.id),eq(collegeMemberships.userId,context.user.id),
  eq(collegeMemberships.collegeId,membership.collegeId),eq(collegeMemberships.status,"ACTIVE"),
  eq(users.platformStatus,"ACTIVE"))).limit(1);
 if(!actor||actor.organizationId!==membership.organizationId)
  throw new AuthorizationError("profile-verification.review");
 const [setting]=await getDb().select({enabled:profileVerificationSettings.tpoCanVerifyProfiles})
  .from(profileVerificationSettings).where(eq(profileVerificationSettings.collegeId,actor.collegeId)).limit(1);
 const [grant]=await getDb().select({id:profileVerificationTpoGrants.membershipId})
  .from(profileVerificationTpoGrants)
  .where(and(eq(profileVerificationTpoGrants.membershipId,membership.id),
    isNull(profileVerificationTpoGrants.revokedAt))).limit(1);
 requirePermission(context,"profile-verification.review",{
  collegeId:actor.collegeId,organizationId:actor.organizationId,
  tpoVerificationEnabled:effectiveTpoVerifierSetting(setting),
  tpoVerificationAdministrator:!!grant,
 });
 return actor;
}
