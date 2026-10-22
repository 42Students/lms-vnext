import "server-only";
import {and,eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {colleges,collegeMemberships,learnerProfiles,membershipRoles} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {isSuperAdmin} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";
import {projectAdminLearnerProfileSections} from "./admin-learner-profile-sections-model";

/** Only the exact selected-college learner membership is allowed to expose
 * the legacy profile-section read. This cannot enumerate another college. */
export async function getAdminLearnerProfileSections(
 context:RequestContext,membershipId:string,
){
 if(!isSuperAdmin(context)||!context.adminScope?.collegeId)
  throw new AuthorizationError("people.manage");
 const selected={...context.adminScope,collegeId:context.adminScope.collegeId};
 requirePermission(context,"people.manage",{
  collegeId:selected.collegeId,organizationId:selected.organizationId,
 });
 const [learner]=await getDb().select({document:learnerProfiles.profileDocument})
  .from(learnerProfiles)
  .innerJoin(collegeMemberships,eq(collegeMemberships.id,learnerProfiles.membershipId))
  .innerJoin(colleges,eq(colleges.id,collegeMemberships.collegeId))
  .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),
   eq(membershipRoles.role,"LEARNER")))
  .where(and(eq(collegeMemberships.id,membershipId),
   eq(colleges.id,selected.collegeId),
   selected.organizationId?eq(colleges.organizationId,selected.organizationId):undefined))
  .limit(1);
 if(!learner)return null;
 return projectAdminLearnerProfileSections(learner.document);
}
