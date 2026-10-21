import "server-only";
import {and,desc,eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {placementApplications,placementApplicationScreenings,
 placementJobRoleOptions,placementJobs,placementOffers,placementJoiningOutcomes} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireTpoJobCollege} from "./tpo-job-write-base";
import {tpoApplicantDetailQuerySchema} from "./tpo-applicant-detail-model";
import {PlacementsServiceError} from "./errors";

/** Read-only compatibility status. Application, screening and offer are
 * independent vNext facts, not one mutable legacy applicant status.
 * Private screening notes never appear as candidate messages.
 */
export async function getTpoApplicantLegacyStatus(
 context:RequestContext,raw:unknown,
){
 const collegeId=await requireTpoJobCollege(context);
 const input=tpoApplicantDetailQuerySchema.parse(raw);
 const db=getDb();
 const [row]=await db.select({
  application:placementApplications,
  screening:placementApplicationScreenings,
  roleTitle:placementJobRoleOptions.title,
 }).from(placementApplications)
  .innerJoin(placementJobs,and(eq(placementJobs.id,placementApplications.jobId),
   eq(placementJobs.collegeId,collegeId)))
  .innerJoin(placementJobRoleOptions,and(
   eq(placementJobRoleOptions.id,placementApplications.roleOptionId),
   eq(placementJobRoleOptions.jobId,input.jobId)))
  .leftJoin(placementApplicationScreenings,
   eq(placementApplicationScreenings.applicationId,placementApplications.id))
  .where(and(eq(placementApplications.id,input.applicationId),
   eq(placementApplications.jobId,input.jobId))).limit(1);
 if(!row)throw new PlacementsServiceError("PLACEMENT_APPLICATION_NOT_FOUND");
 const [offer]=await db.select({
  status:placementOffers.status,
  issuedAt:placementOffers.issuedAt,
  joiningStatus:placementJoiningOutcomes.status,
 }).from(placementOffers)
  .leftJoin(placementJoiningOutcomes,
   eq(placementJoiningOutcomes.offerId,placementOffers.id))
  .where(eq(placementOffers.applicationId,input.applicationId))
  .orderBy(desc(placementOffers.version),desc(placementOffers.id)).limit(1);
 const status=row.application.status==="WITHDRAWN"?"WITHDRAWN":
  offer?.status==="ACCEPTED"&&offer.joiningStatus==="JOINED"?"HIRED":
  offer&&(offer.status==="ISSUED"||offer.status==="ACCEPTED")?"OFFERED":
  row.screening?.status==="REJECTED"?"NOT_SELECTED":
  row.screening?.status==="SHORTLISTED"?"SHORTLISTED":"APPLIED";
 const selfApply=!row.application.appliedByCollege;
 return {
  jobId:input.jobId,applicationId:input.applicationId,
  roleOptionId:row.application.roleOptionId,roleTitle:row.roleTitle,
  applicationStatus:row.application.status,
  screeningStatus:row.screening?.status??"NOT_RECORDED",
  offerStatus:offer?.status??null,
  legacyDisplayStatus:status,
  submittedAt:row.application.submittedAt.toISOString(),
  source:row.application.appliedByCollege?"COLLEGE":"LEARNER",
  channel:row.application.channel,
  // Keep the two distinct data channels explicit and never concatenate them.
  staffOnlyReason:row.screening?.internalReason??null,
  candidateFacingMessage:row.screening?.candidateMessage??null,
  appliedByCollege:row.application.appliedByCollege,
  optOutDueAt:row.application.appliedByCollegeOptOutUntil?.toISOString()??null,
  statusBeforeWithdrawal:row.application.statusBeforeWithdrawal??null,
  canUndoBulk:false,
  undoUnavailabilityReason:"Application bulk Undo is unavailable because notification holds and prior-stage undo references are not registered.",
  notificationHoldState:"NOT_CONFIGURED",
  isSelfApplied:selfApply,
 };
}
