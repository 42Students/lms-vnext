import "server-only";
import {and,eq,gt} from "drizzle-orm";
import {getDb} from "@/db/client";
import {
 placementCompanies,placementCompanyRelationships,
 placementRecruiterCollegeGrants,placementRecruiterProfiles,users,
} from "@/db/schema";
import {hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {requirePlacementManageScope} from "./scope";

/** Recruiter picker: only active, verified and unexpired access in this college.
 * Never emit emails, phone numbers or anyone else's memberships.
 */
export async function listTpoMessageRecruiters(context:RequestContext){
 const member=context.membership;
 if(!member||member.status!=="ACTIVE"||!hasMembershipRole(context,"TPO")||
    context.user.platformStatus!=="ACTIVE")throw new AuthorizationError("placements.manage");
 await requirePlacementManageScope(context,member.collegeId);
 return getDb().selectDistinct({
  userId:users.id,displayName:users.displayName,
  companyName:placementCompanies.name,
 }).from(placementRecruiterCollegeGrants)
  .innerJoin(placementRecruiterProfiles,
   eq(placementRecruiterProfiles.userId,placementRecruiterCollegeGrants.recruiterUserId))
  .innerJoin(users,eq(users.id,placementRecruiterProfiles.userId))
  .innerJoin(placementCompanyRelationships,
   eq(placementCompanyRelationships.id,placementRecruiterCollegeGrants.companyRelationshipId))
  .innerJoin(placementCompanies,and(
   eq(placementCompanies.id,placementCompanyRelationships.companyId),
   eq(placementCompanies.id,placementRecruiterProfiles.companyId)))
  .where(and(eq(placementCompanyRelationships.collegeId,member.collegeId),
   eq(placementCompanyRelationships.status,"ACTIVE"),
   eq(placementCompanies.status,"ACTIVE"),
   eq(placementRecruiterProfiles.status,"ACTIVE"),
   eq(users.platformStatus,"ACTIVE"),
   eq(placementRecruiterCollegeGrants.status,"ACTIVE"),
   eq(placementRecruiterCollegeGrants.verificationStatus,"VERIFIED"),
   gt(placementRecruiterCollegeGrants.validUntil,new Date())));
}
