import "server-only";
import {and,eq,gt,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {collegeMemberships,colleges,organizations,placementApplications,placementApplicationScreenings,
 placementJobs,placementCompanies,placementCompanyRelationships,
 placementRecruiterProfiles,placementRecruiterCollegeGrants,
 placementRecruiterPrivateReviews,users} from "@/db/schema";
import {hasActiveRecruiter,type RequestContext} from "@/modules/identity/context";
import {can} from "@/modules/permissions/policy";
import {PlacementsServiceError} from "./errors";
import {getRecruiterPlacementWorkspace} from "./recruiter-workspace-service";
import {recruiterOwnJobPredicate} from "./recruiter-job-ownership";

export const privateRecruiterRatingSchema=z.strictObject({
 rating:z.number().int().min(1).max(5).nullable(),
 note:z.string().trim().max(1000),
 expectedUpdatedAt:z.string().datetime({offset:true}).nullable(),
});
export class RecruiterPrivateReviewConflict extends Error {
 constructor(){super("The rating was changed. Reload it before saving.");}
}
async function verifyOwnSharedApplication(ctx:RequestContext,jobId:string,applicationId:string){
 if(!hasActiveRecruiter(ctx)||!ctx.recruiter||ctx.recruiter.userId!==ctx.user.id)
  throw new PlacementsServiceError("PLACEMENT_APPLICATION_NOT_FOUND");
 const workspace=await getRecruiterPlacementWorkspace(ctx,jobId);
 const grant=ctx.recruiter.grants.find(row=>row.collegeId===workspace.college.id &&
  row.companyRelationshipId===workspace.job.companyRelationshipId);
 if(!grant||!can(ctx,"placements.recruiter.read",{collegeId:workspace.college.id,
  placementCompanyRelationshipId:workspace.job.companyRelationshipId}))
  throw new PlacementsServiceError("PLACEMENT_APPLICATION_NOT_FOUND");
 const [row]=await getDb().select({id:placementApplications.id})
  .from(placementApplications)
  .innerJoin(placementApplicationScreenings,
   eq(placementApplicationScreenings.applicationId,placementApplications.id))
  .innerJoin(collegeMemberships,eq(collegeMemberships.id,placementApplications.membershipId))
  .innerJoin(users,eq(users.id,collegeMemberships.userId))
  .where(and(eq(placementApplications.id,applicationId),eq(placementApplications.jobId,jobId),
   eq(placementApplications.status,"SUBMITTED"),eq(placementApplicationScreenings.status,"SHORTLISTED"),
   eq(collegeMemberships.collegeId,workspace.college.id),
   eq(collegeMemberships.status,"ACTIVE"),eq(users.platformStatus,"ACTIVE")))
  .limit(1);
 if(!row)throw new PlacementsServiceError("PLACEMENT_APPLICATION_NOT_FOUND");
 return workspace;
}
export async function readRecruiterPrivateReview(ctx:RequestContext,rawJobId:string,rawApplicationId:string){
 const jobId=z.string().uuid().parse(rawJobId),applicationId=z.string().uuid().parse(rawApplicationId);
 await verifyOwnSharedApplication(ctx,jobId,applicationId);
 const [review]=await getDb().select({rating:placementRecruiterPrivateReviews.rating,
  note:placementRecruiterPrivateReviews.note,updatedAt:placementRecruiterPrivateReviews.updatedAt})
  .from(placementRecruiterPrivateReviews)
  .where(and(eq(placementRecruiterPrivateReviews.applicationId,applicationId),
   eq(placementRecruiterPrivateReviews.recruiterUserId,ctx.user.id))).limit(1);
 return {rating:review?.rating??null,note:review?.note??"",
  updatedAt:review?.updatedAt.toISOString()??null};
}
export async function writeRecruiterPrivateReview(ctx:RequestContext,rawJobId:string,
 rawApplicationId:string,raw:unknown){
 const jobId=z.string().uuid().parse(rawJobId),applicationId=z.string().uuid().parse(rawApplicationId);
 const input=privateRecruiterRatingSchema.parse(raw);
 const scope=await verifyOwnSharedApplication(ctx,jobId,applicationId);
 return getDb().transaction(async tx=>{
  // Lock the candidate before an optimistic write, so two reviewer tabs
  // cannot silently replace each other's note or rating.
  const [owned]=await tx.select({id:placementApplications.id})
   .from(placementApplications)
   .innerJoin(placementJobs,eq(placementJobs.id,placementApplications.jobId))
   .innerJoin(placementApplicationScreenings,
    eq(placementApplicationScreenings.applicationId,placementApplications.id))
   // DB079: do not trust a recruiter session or an earlier workspace read.
   // Lock every live principal/relationship/grant used for the decision,
   // alongside the candidate. A concurrent revoke must serialize here.
   .innerJoin(collegeMemberships,and(
     eq(collegeMemberships.id,placementApplications.membershipId),
     eq(collegeMemberships.collegeId,placementJobs.collegeId),
     eq(collegeMemberships.status,"ACTIVE")))
   .innerJoin(users,and(eq(users.id,ctx.user.id),
     eq(users.platformStatus,"ACTIVE")))
   .innerJoin(placementRecruiterProfiles,and(
     eq(placementRecruiterProfiles.userId,users.id),
     eq(placementRecruiterProfiles.status,"ACTIVE")))
   .innerJoin(placementCompanyRelationships,and(
     eq(placementCompanyRelationships.id,placementJobs.companyRelationshipId),
     eq(placementCompanyRelationships.collegeId,placementJobs.collegeId),
     eq(placementCompanyRelationships.companyId,placementRecruiterProfiles.companyId),
     eq(placementCompanyRelationships.status,"ACTIVE")))
   .innerJoin(placementCompanies,and(
     eq(placementCompanies.id,placementCompanyRelationships.companyId),
     eq(placementCompanies.status,"ACTIVE")))
   .innerJoin(colleges,and(eq(colleges.id,placementJobs.collegeId),
     eq(colleges.status,"ACTIVE")))
   .innerJoin(organizations,and(eq(organizations.id,colleges.organizationId),
     eq(organizations.status,"ACTIVE")))
   .innerJoin(placementRecruiterCollegeGrants,and(
     eq(placementRecruiterCollegeGrants.recruiterUserId,ctx.user.id),
     eq(placementRecruiterCollegeGrants.companyRelationshipId,placementJobs.companyRelationshipId),
     eq(placementRecruiterCollegeGrants.status,"ACTIVE"),
     eq(placementRecruiterCollegeGrants.verificationStatus,"VERIFIED"),
     gt(placementRecruiterCollegeGrants.validUntil,sql`clock_timestamp()`),
     sql`'DRIVES' = any(${placementRecruiterCollegeGrants.capabilities})`))
   .where(and(eq(placementApplications.id,applicationId),
    eq(placementApplications.jobId,jobId),
    eq(placementJobs.collegeId,scope.college.id),
    eq(placementRecruiterProfiles.companyId,scope.company.id),
    recruiterOwnJobPredicate(ctx.user.id),
    eq(placementApplications.status,"SUBMITTED"),
    eq(placementApplicationScreenings.status,"SHORTLISTED")))
   .for("update").limit(1);
  if(!owned)throw new PlacementsServiceError("PLACEMENT_APPLICATION_NOT_FOUND");
  const [current]=await tx.select({id:placementRecruiterPrivateReviews.id,
   updatedAt:placementRecruiterPrivateReviews.updatedAt})
   .from(placementRecruiterPrivateReviews)
   .where(and(eq(placementRecruiterPrivateReviews.applicationId,applicationId),
    eq(placementRecruiterPrivateReviews.recruiterUserId,ctx.user.id))).limit(1);
  if((current?.updatedAt.toISOString()??null)!==input.expectedUpdatedAt)
   throw new RecruiterPrivateReviewConflict();
  if(current){
   const [updated]=await tx.update(placementRecruiterPrivateReviews).set({
    rating:input.rating,note:input.note,
    updatedAt:sql`greatest(clock_timestamp(),${placementRecruiterPrivateReviews.updatedAt} + interval '1 millisecond')`,
   }).where(eq(placementRecruiterPrivateReviews.id,current.id))
    .returning({rating:placementRecruiterPrivateReviews.rating,
     note:placementRecruiterPrivateReviews.note,updatedAt:placementRecruiterPrivateReviews.updatedAt});
   if(!updated)throw new RecruiterPrivateReviewConflict();
   return {rating:updated.rating,note:updated.note,updatedAt:updated.updatedAt.toISOString()};
  }
  const [created]=await tx.insert(placementRecruiterPrivateReviews).values({
   applicationId,recruiterUserId:ctx.user.id,rating:input.rating,note:input.note,
  }).returning({rating:placementRecruiterPrivateReviews.rating,
   note:placementRecruiterPrivateReviews.note,updatedAt:placementRecruiterPrivateReviews.updatedAt});
  if(!created)throw new RecruiterPrivateReviewConflict();
  return {rating:created.rating,note:created.note,updatedAt:created.updatedAt.toISOString()};
 });
}
