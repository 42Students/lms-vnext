import "server-only";
import {and,eq} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {collegeMemberships,placementApplications,placementApplicationScreenings,
 placementRecruiterCollegeGrants,placementRecruiterProfiles,placementRecruiterPrivateReviews,users} from "@/db/schema";
import {getRecruiterPlacementWorkspace} from "./recruiter-workspace-service";
import {hasActiveRecruiter,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";
import {PlacementsServiceError} from "./errors";

export const recruiterPrivateRatingSchema=z.strictObject({
 rating:z.number().int().min(1).max(5).nullable(),
 note:z.string().trim().max(1000),
});
const id=z.string().uuid();

/** Access to the exact active company/college relationship is checked on each
 * read. Unshared applications and withdrawn learners are indistinguishable from
 * a nonexistent application. */
async function requirePrivateRatingScope(context:RequestContext,jobInput:string,applicationInput:string){
 const jobId=id.parse(jobInput),applicationId=id.parse(applicationInput);
 if(!hasActiveRecruiter(context)||!context.recruiter||
   context.recruiter.userId!==context.user.id)throw new AuthorizationError("placements.recruiter.note");
 const workspace=await getRecruiterPlacementWorkspace(context,jobId);
 const grant=context.recruiter.grants.find(g=>g.collegeId===workspace.college.id);
 if(!grant)throw new AuthorizationError("placements.recruiter.note");
 requirePermission(context,"placements.recruiter.note",{
  collegeId:workspace.college.id,placementCompanyRelationshipId:grant.companyRelationshipId,
 });
 const [candidate]=await getDb().select({id:placementApplications.id})
  .from(placementApplications)
  .innerJoin(placementApplicationScreenings,eq(placementApplicationScreenings.applicationId,placementApplications.id))
  .innerJoin(collegeMemberships,eq(collegeMemberships.id,placementApplications.membershipId))
  .innerJoin(users,eq(users.id,collegeMemberships.userId))
  .where(and(eq(placementApplications.id,applicationId),eq(placementApplications.jobId,jobId),
   eq(placementApplications.status,"SUBMITTED"),
   eq(placementApplicationScreenings.status,"SHORTLISTED"),
   eq(collegeMemberships.collegeId,workspace.college.id),
   eq(collegeMemberships.status,"ACTIVE"),eq(users.platformStatus,"ACTIVE"))).limit(1);
 if(!candidate)throw new PlacementsServiceError("PLACEMENT_APPLICATION_NOT_FOUND");
 return {jobId,applicationId,grant};
}
export async function getOwnRecruiterCandidateRating(ctx:RequestContext,jobId:string,applicationId:string){
 const scope=await requirePrivateRatingScope(ctx,jobId,applicationId);
 const [row]=await getDb().select({rating:placementRecruiterPrivateReviews.rating,
  note:placementRecruiterPrivateReviews.note})
 .from(placementRecruiterPrivateReviews)
 .where(and(eq(placementRecruiterPrivateReviews.recruiterUserId,ctx.user.id),
  eq(placementRecruiterPrivateReviews.applicationId,scope.applicationId))).limit(1);
 return row??{rating:null,note:""};
}
export async function saveOwnRecruiterCandidateRating(ctx:RequestContext,jobId:string,applicationId:string,raw:unknown){
 const scope=await requirePrivateRatingScope(ctx,jobId,applicationId);
 const input=recruiterPrivateRatingSchema.parse(raw);
 return getDb().transaction(async tx=>{
  // Re-check live actor and company grant while holding write transaction.
  const [live]=await tx.select({id:placementRecruiterCollegeGrants.id})
   .from(placementRecruiterCollegeGrants)
   .innerJoin(placementRecruiterProfiles,eq(placementRecruiterProfiles.userId,placementRecruiterCollegeGrants.recruiterUserId))
   .innerJoin(users,eq(users.id,placementRecruiterProfiles.userId))
   .where(and(eq(placementRecruiterCollegeGrants.id,scope.grant.id),
    eq(placementRecruiterCollegeGrants.recruiterUserId,ctx.user.id),
    eq(placementRecruiterCollegeGrants.companyRelationshipId,scope.grant.companyRelationshipId),
    eq(placementRecruiterCollegeGrants.status,"ACTIVE"),
    eq(placementRecruiterProfiles.status,"ACTIVE"),
    eq(placementRecruiterProfiles.companyId,ctx.recruiter!.companyId),
    eq(users.platformStatus,"ACTIVE"))).limit(1);
  if(!live)throw new AuthorizationError("placements.recruiter.note");
  const where=and(eq(placementRecruiterPrivateReviews.recruiterUserId,ctx.user.id),
   eq(placementRecruiterPrivateReviews.applicationId,scope.applicationId));
  if(input.rating===null&&!input.note){
   await tx.delete(placementRecruiterPrivateReviews).where(where);
   return {rating:null,note:""};
  }
  const [saved]=await tx.insert(placementRecruiterPrivateReviews).values({
   recruiterUserId:ctx.user.id,applicationId:scope.applicationId,rating:input.rating,note:input.note,
  }).onConflictDoUpdate({
   target:[placementRecruiterPrivateReviews.recruiterUserId,placementRecruiterPrivateReviews.applicationId],
   set:{rating:input.rating,note:input.note,updatedAt:new Date()},
  }).returning({rating:placementRecruiterPrivateReviews.rating,note:placementRecruiterPrivateReviews.note});
  if(!saved)throw new PlacementsServiceError("PLACEMENT_APPLICATION_NOT_FOUND");
  return saved;
 });
}
