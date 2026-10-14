import "server-only";
import {and,desc,eq,isNull} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships,placementApplications,placementApplicationScreenings,
 placementJobRoleOptions,placementJobRounds,placementJobs,placementJoiningOutcomes,
 placementOffers,placementRoundResults,users} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {PlacementsServiceError} from "./errors";
import {requireTpoJobCollege} from "./tpo-job-write-base";
import {projectTpoApplicantDetail,tpoApplicantDetailQuerySchema} from "./tpo-applicant-detail-model";
export async function getTpoApplicantDetail(context:RequestContext,raw:unknown){
 const collegeId=await requireTpoJobCollege(context);
 const input=tpoApplicantDetailQuerySchema.parse(raw),db=getDb();
 const [job]=await db.select({id:placementJobs.id,title:placementJobs.title})
 .from(placementJobs).where(and(eq(placementJobs.id,input.jobId),
  eq(placementJobs.collegeId,collegeId),isNull(placementJobs.archivedAt))).limit(1);
 if(!job)throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
 const [app]=await db.select({
  id:placementApplications.id,jobId:placementApplications.jobId,
  membershipId:placementApplications.membershipId,
  student:users.displayName,applicationStatus:placementApplications.status,
  eligibilityStatus:placementApplications.eligibilityStatus,
  channel:placementApplications.channel,submittedAt:placementApplications.submittedAt,
  roleTitle:placementJobRoleOptions.title,
  screeningStatus:placementApplicationScreenings.status,
  screeningUpdatedAt:placementApplicationScreenings.updatedAt,
  screeningDecidedAt:placementApplicationScreenings.decidedAt,
 }).from(placementApplications)
  .innerJoin(collegeMemberships,and(
   eq(collegeMemberships.id,placementApplications.membershipId),
   eq(collegeMemberships.collegeId,collegeId)))
  .innerJoin(users,eq(users.id,collegeMemberships.userId))
  .innerJoin(placementJobRoleOptions,and(eq(placementJobRoleOptions.id,placementApplications.roleOptionId),
   eq(placementJobRoleOptions.jobId,job.id)))
  .leftJoin(placementApplicationScreenings,eq(placementApplicationScreenings.applicationId,placementApplications.id))
  .where(and(eq(placementApplications.id,input.applicationId),
    eq(placementApplications.jobId,job.id))).limit(1);
 if(!app)throw new PlacementsServiceError("PLACEMENT_APPLICATION_NOT_FOUND");
 const [results,offers]=await Promise.all([
  db.select({
   roundId:placementJobRounds.id,roundName:placementJobRounds.name,
   kind:placementJobRounds.kind,version:placementRoundResults.version,
   outcome:placementRoundResults.outcome,appliedAt:placementRoundResults.appliedAt,
  }).from(placementRoundResults)
    .innerJoin(placementJobRounds,and(eq(placementJobRounds.id,placementRoundResults.roundId),
      eq(placementJobRounds.jobId,job.id)))
    .where(and(eq(placementRoundResults.applicationId,app.id),
     eq(placementRoundResults.status,"APPLIED")))
    .orderBy(desc(placementRoundResults.version)).limit(101),
  db.select({
   offerId:placementOffers.id,version:placementOffers.version,
   status:placementOffers.status,roleTitle:placementOffers.roleTitle,
   annualCtcInr:placementOffers.annualCtcInr,
   issuedAt:placementOffers.issuedAt,expiresAt:placementOffers.expiresAt,
   joiningStatus:placementJoiningOutcomes.status,
  }).from(placementOffers)
    .leftJoin(placementJoiningOutcomes,eq(placementJoiningOutcomes.offerId,placementOffers.id))
    .where(eq(placementOffers.applicationId,app.id))
    .orderBy(desc(placementOffers.version)).limit(101),
 ]);
 const projected=projectTpoApplicantDetail(
  {status:app.applicationStatus,screeningStatus:app.screeningStatus},
  results.slice(0,100).map(r=>({...r,appliedAt:r.appliedAt?.toISOString()??null})),
  offers.slice(0,100).map(o=>({...o,issuedAt:o.issuedAt.toISOString(),
   expiresAt:o.expiresAt?.toISOString()??null})),
 );
 return {job,application:{
  id:app.id,membershipId:app.membershipId,student:app.student,
  channel:app.channel,eligibilityStatus:app.eligibilityStatus,
  submittedAt:app.submittedAt.toISOString(),roleTitle:app.roleTitle,
  screeningDecidedAt:app.screeningDecidedAt?.toISOString()??null,
  screeningUpdatedAt:app.screeningUpdatedAt?.toISOString()??null,
 },...projected,
  resultsTruncated:results.length>100,offersTruncated:offers.length>100,
 };
}
