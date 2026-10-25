import "server-only";
import {and,asc,eq,inArray,isNotNull} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships,placementApplications,placementApplicationScreenings,users} from "@/db/schema";
import {placementRoundCandidateSlots} from "@/db/schema/placement-round-candidate-slots";
import type {RequestContext} from "@/modules/identity/context";
import {getRecruiterPlacementWorkspace} from "./recruiter-workspace-service";
import {projectRecruiterBookedInterviews} from "./recruiter-booked-interviews-model";

/** Read candidate-specific appointments only after validating an active recruiter,
 * exact employer relationship and college grant against persisted workspace.
 * No unscreened learner names or unbooked slot owners leave this service.
 */
export async function getRecruiterBookedInterviews(context:RequestContext,jobId:string){
 const workspace=await getRecruiterPlacementWorkspace(context,jobId);
 const activeRounds=workspace.rounds.filter(round=>
   round.kind==="INTERVIEW"&&round.status!=="CANCELLED");
 if(activeRounds.length===0)return {status:"READY" as const,items:[],truncated:false};
 const rows=await getDb().select({
   slotId:placementRoundCandidateSlots.id,
   roundId:placementRoundCandidateSlots.roundId,
   name:users.displayName,
   startsAt:placementRoundCandidateSlots.startsAt,
   endsAt:placementRoundCandidateSlots.endsAt,
   panel:placementRoundCandidateSlots.panel,
   room:placementRoundCandidateSlots.room,
   confirmedAt:placementRoundCandidateSlots.confirmedAt,
   learnerConfirmedAt:placementRoundCandidateSlots.learnerConfirmedAt,
 }).from(placementRoundCandidateSlots)
 .innerJoin(placementApplications,and(
   eq(placementApplications.id,placementRoundCandidateSlots.applicationId),
   eq(placementApplications.jobId,workspace.job.id),
   eq(placementApplications.status,"SUBMITTED")))
 .innerJoin(placementApplicationScreenings,and(
   eq(placementApplicationScreenings.applicationId,placementApplications.id),
   eq(placementApplicationScreenings.status,"SHORTLISTED")))
 .innerJoin(collegeMemberships,and(
   eq(collegeMemberships.id,placementApplications.membershipId),
   eq(collegeMemberships.collegeId,workspace.college.id),
   eq(collegeMemberships.status,"ACTIVE")))
 .innerJoin(users,and(
   eq(users.id,collegeMemberships.userId),
   eq(users.platformStatus,"ACTIVE")))
 .where(and(
   eq(placementRoundCandidateSlots.jobId,workspace.job.id),
   inArray(placementRoundCandidateSlots.roundId,activeRounds.map(round=>round.id)),
   eq(placementRoundCandidateSlots.status,"BOOKED"),
   isNotNull(placementRoundCandidateSlots.applicationId)))
 .orderBy(asc(placementRoundCandidateSlots.startsAt),asc(placementRoundCandidateSlots.id))
 .limit(201);
 return {status:"READY" as const,items:projectRecruiterBookedInterviews(rows.slice(0,200)),
   truncated:rows.length>200};
}
