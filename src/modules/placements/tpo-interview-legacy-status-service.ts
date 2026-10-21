import "server-only";
import {and,desc,eq,gt,lt,ne} from "drizzle-orm";
import {getDb} from "@/db/client";
import {placementApplications,placementJobRounds,placementJobs,
 placementRoundResults} from "@/db/schema";
import {placementRoundCandidateSlots as slots} from "@/db/schema/placement-round-candidate-slots";
import type {RequestContext} from "@/modules/identity/context";
import {requireTpoJobCollege} from "./tpo-job-write-base";
import {placementJobIdSchema} from "./validation";
import {PlacementsServiceError} from "./errors";
import {z} from "zod";

/** Authenticated read projection for legacy interview status chips.
 * A BOOKED inventory slot is not a learner confirmation or a completed
 * interview. Staff-only feedback never appears in a learner DTO here.
 */
export async function getTpoInterviewLegacyStatus(
 context:RequestContext,rawJobId:unknown,rawSlotId:unknown,
){
 const collegeId=await requireTpoJobCollege(context);
 const jobId=placementJobIdSchema.parse(rawJobId);
 const slotId=z.string().uuid().parse(rawSlotId),db=getDb();
 const [row]=await db.select({
  slot:slots,roundKind:placementJobRounds.kind,
  roundStatus:placementJobRounds.status,
  membershipId:placementApplications.membershipId,
 }).from(slots)
  .innerJoin(placementJobs,and(eq(placementJobs.id,slots.jobId),
   eq(placementJobs.collegeId,collegeId)))
  .innerJoin(placementJobRounds,and(eq(placementJobRounds.id,slots.roundId),
   eq(placementJobRounds.jobId,jobId)))
  .leftJoin(placementApplications,and(eq(placementApplications.id,slots.applicationId),
   eq(placementApplications.jobId,jobId)))
  .where(and(eq(slots.id,slotId),eq(slots.jobId,jobId))).limit(1);
 if(!row||row.roundKind!=="INTERVIEW")
  throw new PlacementsServiceError("PLACEMENT_ROUND_NOT_FOUND");
 if(row.slot.status==="BOOKED"&&!row.membershipId)
  throw new PlacementsServiceError("PLACEMENT_APPLICATION_NOT_FOUND");
 const slot=row.slot;
 const [result]=slot.applicationId?await db.select({
  outcome:placementRoundResults.outcome,appliedAt:placementRoundResults.appliedAt,
 }).from(placementRoundResults).where(and(
   eq(placementRoundResults.applicationId,slot.applicationId),
   eq(placementRoundResults.roundId,slot.roundId),
   eq(placementRoundResults.status,"APPLIED")))
  .orderBy(desc(placementRoundResults.version)).limit(1):[];
 // Advisory conflicts, limited to the authorized college. The booking
 // writer remains responsible for its membership row lock and collision gate.
 const overlaps=row.membershipId&&slot.status==="BOOKED"?
  await db.select({id:slots.id}).from(slots)
   .innerJoin(placementApplications,
    eq(placementApplications.id,slots.applicationId))
   .innerJoin(placementJobs,and(eq(placementJobs.id,slots.jobId),
    eq(placementJobs.collegeId,collegeId)))
   .where(and(eq(placementApplications.membershipId,row.membershipId),
    eq(slots.status,"BOOKED"),ne(slots.id,slot.id),
    lt(slots.startsAt,slot.endsAt),gt(slots.endsAt,slot.startsAt)))
   .limit(10):[];
 const displayStatus=slot.status==="CANCELLED"?"CANCELLED":
  slot.interviewOutcome==="COMPLETED"?"COMPLETED":
  slot.interviewOutcome==="NO_SHOW"?"NO_SHOW":
  slot.status==="AVAILABLE"?"AVAILABLE":
  slot.learnerConfirmedAt?"LEARNER_CONFIRMED":
  slot.confirmedAt?"BOOKED_CONFIRMED":"BOOKED_AWAITING_CONFIRMATION";
 return {
  id:slot.id,jobId,roundId:slot.roundId,applicationId:slot.applicationId,
  version:slot.version,slotStatus:slot.status,
  roundStatus:row.roundStatus,interviewOutcome:slot.interviewOutcome,
  displayStatus,source:slot.source,
  startsAt:slot.startsAt.toISOString(),endsAt:slot.endsAt.toISOString(),
  room:slot.room,panel:slot.panel,
  bookedConfirmedAt:slot.confirmedAt?.toISOString()??null,
  learnerConfirmedAt:slot.learnerConfirmedAt?.toISOString()??null,
  roundResult:result?{
   outcome:result.outcome,appliedAt:result.appliedAt?.toISOString()??null,
  }:null,
  overlappingBookedSlotIds:overlaps.map(x=>x.id),
  legacyInterviewId:slot.legacyInterviewId??null,
  legacyInterviewStatus:slot.legacyInterviewStatus??null,
  legacyInterviewType:slot.legacyInterviewType??null,
  feedback:{
   available:false as const,source:"UNREGISTERED_STAFF_FEEDBACK",
   message:"Rating, interviewer recommendation and private feedback require the separate staff-only feedback record.",
  },
  // This is not a signed receipt or rebooking authorization.
  advisoryOnly:true as const,
 };
}
