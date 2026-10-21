import "server-only";
import {and,asc,eq,ne,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships,placementApplications,placementJobRounds,placementJobs,placementRoundResults,users} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {PlacementsServiceError} from "./errors";
import {applyPlacementRoundResult} from "./result-service";
import {requireTpoJobCollege,requireTpoJobActor} from "./tpo-job-write-base";
import {placementJobIdSchema,placementRoundIdSchema} from "./validation";
import {roundApplyInputSchema,roundApplyPreviewToken,summarizeRoundApply,roundApplyFailureReason} from "./tpo-round-apply-model";

export async function getTpoRoundApplyPreview(context:RequestContext,rawJobId:unknown,rawRoundId:unknown){
 const collegeId=await requireTpoJobCollege(context);
 const jobId=placementJobIdSchema.parse(rawJobId),roundId=placementRoundIdSchema.parse(rawRoundId);
 const [scope]=await getDb().select({
  roundId:placementJobRounds.id,roundName:placementJobRounds.name,
  roundStatus:placementJobRounds.status,roundKind:placementJobRounds.kind,
  roundUpdatedAt:placementJobRounds.updatedAt,
  jobStatus:placementJobs.status,jobTitle:placementJobs.title,
 }).from(placementJobRounds).innerJoin(placementJobs,eq(placementJobs.id,placementJobRounds.jobId))
  .where(and(eq(placementJobRounds.id,roundId),eq(placementJobs.id,jobId),
   eq(placementJobs.collegeId,collegeId))).limit(1);
 if(!scope)throw new PlacementsServiceError("PLACEMENT_ROUND_NOT_FOUND");
 const facts=await getDb().select({
  resultId:placementRoundResults.id,applicationId:placementRoundResults.applicationId,
  student:users.displayName,outcome:placementRoundResults.outcome,
  status:placementRoundResults.status,version:placementRoundResults.version,
 }).from(placementRoundResults)
  .innerJoin(placementApplications,eq(placementApplications.id,placementRoundResults.applicationId))
  .innerJoin(collegeMemberships,eq(collegeMemberships.id,placementApplications.membershipId))
  .innerJoin(users,eq(users.id,collegeMemberships.userId))
  .where(and(eq(placementRoundResults.roundId,roundId),
   eq(placementApplications.jobId,jobId),eq(collegeMemberships.collegeId,collegeId),
   ne(placementRoundResults.status,"SUPERSEDED")))
  .orderBy(users.displayName,placementRoundResults.applicationId);
 const evaluativeRounds=await getDb().select({id:placementJobRounds.id,
  sequence:placementJobRounds.sequence,kind:placementJobRounds.kind})
  .from(placementJobRounds).where(and(eq(placementJobRounds.jobId,jobId),
    ne(placementJobRounds.status,"CANCELLED"),ne(placementJobRounds.kind,"TALK")))
  .orderBy(asc(placementJobRounds.sequence));
 const currentIndex=evaluativeRounds.findIndex(x=>x.id===roundId);
 const next=currentIndex>=0?evaluativeRounds[currentIndex+1]??null:null;
 const passDestination=next?next.kind==="INTERVIEW"?"Interview":next.kind==="GD"?"Group discussion":next.kind==="VENDOR_TEST"?"External assessment":"Next test":"Final round cleared";
 const rows=facts.map(x=>({...x,student:x.student??"Learner",
  destination:x.outcome==="PASS"?passDestination:x.outcome==="FAIL"?"Not cleared":
   x.outcome==="HOLD"?"Waitlisted":"Absent"}));
 const ready=scope.jobStatus==="PUBLISHED"&&scope.roundStatus==="COMPLETED"&&scope.roundKind!=="TALK";
 // Recheck active officer membership after async student-result reads; stale
 // sessions must not receive a previously authorized result export.
 await getDb().transaction(async tx=>{await requireTpoJobActor(tx,context);});
 return {scope,ready,rows,destinations:{PASS:passDestination,FAIL:"Not cleared",
   HOLD:"Waitlisted",ABSENT:"Absent"},...summarizeRoundApply(rows),
  previewToken:roundApplyPreviewToken(roundId+"|"+scope.roundUpdatedAt.toISOString(),rows),
  skippedUnrecordedNote:"Applicants with no staged result remain pending; they are not automatically failed."};
}
export async function applyTpoWholeRound(context:RequestContext,rawJobId:unknown,rawRoundId:unknown,raw:unknown){
 const input=roundApplyInputSchema.parse(raw);
 const preview=await getTpoRoundApplyPreview(context,rawJobId,rawRoundId);
 if(!preview.ready)throw new PlacementsServiceError("PLACEMENT_RESULT_ROUND_NOT_READY");
 if(input.expectedPreviewToken!==preview.previewToken)throw new PlacementsServiceError("PLACEMENT_JOB_PREVIEW_STALE");
 /** Each whole-round submission consumes its observed round revision in
  * one short transaction BEFORE entering the per-applicant transactions.
  * A second officer using the same preview loses the CAS, even when both
  * originally saw identical staged results. We deliberately do not keep a
  * FOR UPDATE lock open while another transaction applies applicants, which
  * would deadlock against result-service's job/round row locks.
  *
  * vNext intentionally requires a COMPLETED round before results can be
  * applied. An apply with skipped/unchanged results never re-completes or
  * fabricates selection history; the remaining staged rows are retryable
  * from a fresh preview. Every per-result transaction is independently
  * atomic with its stage, activity event and learner notice. Unlike legacy
  * one-call bulk apply, partial results are explicit rather than hidden.
  */
 if(preview.staged>0){
  await getDb().transaction(async tx=>{
   await requireTpoJobActor(tx,context);
   const expectedTime=preview.scope.roundUpdatedAt.toISOString();
   const [claimed]=await tx.update(placementJobRounds).set({
    updatedAt:sql`greatest(clock_timestamp(), ${placementJobRounds.updatedAt} + interval '1 millisecond')`,
   }).where(and(
    eq(placementJobRounds.id,preview.scope.roundId),
    eq(placementJobRounds.jobId,placementJobIdSchema.parse(rawJobId)),
    eq(placementJobRounds.status,"COMPLETED"),
    sql`date_trunc('milliseconds', ${placementJobRounds.updatedAt}) = ${expectedTime}::timestamptz`,
   )).returning({id:placementJobRounds.id});
   if(!claimed)throw new PlacementsServiceError("PLACEMENT_JOB_PREVIEW_STALE");
  });
 }
 const results:Array<{resultId:string;applicationId:string;student:string;outcome:string;status:"applied"|"skipped";reason?:string}>=[];
 for(const row of preview.rows.filter(r=>r.status==="STAGED")){
  try{
   await applyPlacementRoundResult(context,row.resultId,row.version);
   results.push({...row,status:"applied"});
  }catch(error){
   results.push({...row,status:"skipped",reason:roundApplyFailureReason(error)});
  }
 }
 const applied=results.filter(r=>r.status==="applied").length;
 const skipped=results.filter(r=>r.status==="skipped").length;
 return {total:preview.rows.length,previouslyApplied:preview.applied,
  applied,skipped,partial:skipped>0,
  completion:"ROUND_ALREADY_COMPLETED" as const,
  retryRequiresFreshPreview:skipped>0,
  unchanged:preview.rows.filter(r=>r.status==="APPLIED").length,results};
}
