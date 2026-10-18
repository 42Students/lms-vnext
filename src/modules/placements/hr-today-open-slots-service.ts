import "server-only";
import {and,asc,eq,gt,inArray,ne,isNull} from "drizzle-orm";
import {getDb} from "@/db/client";
import {placementJobRounds,placementJobs} from "@/db/schema";
import {hrInterviewSlots} from "@/db/schema/placement-hr-interview-slots";

/** REC-home-drives-01: only a scheduled future interview without an active
 * employer slot needs a slot proposal. Never use suppressed application data. */
export async function listRecruiterTodayRoundsNeedingSlots(
 collegeId:string,authorizedJobIds:readonly string[],now:Date,
){
 const ids=[...new Set(authorizedJobIds)];if(!ids.length)return [];
 const rounds=await getDb().select({
  id:placementJobRounds.id,jobId:placementJobs.id,jobTitle:placementJobs.title,
  name:placementJobRounds.name,scheduledAt:placementJobRounds.scheduledAt,
 }).from(placementJobRounds).innerJoin(placementJobs,
  eq(placementJobs.id,placementJobRounds.jobId))
 .where(and(inArray(placementJobRounds.jobId,ids),
  eq(placementJobs.collegeId,collegeId),eq(placementJobs.status,"PUBLISHED"),
  isNull(placementJobs.archivedAt),
  eq(placementJobRounds.kind,"INTERVIEW"),eq(placementJobRounds.status,"SCHEDULED"),
  gt(placementJobRounds.scheduledAt,now)))
 .orderBy(asc(placementJobRounds.scheduledAt)).limit(100);
 if(!rounds.length)return [];
 const covered=await getDb().select({roundId:hrInterviewSlots.roundId,status:hrInterviewSlots.status})
  .from(hrInterviewSlots)
  .where(and(inArray(hrInterviewSlots.roundId,rounds.map(r=>r.id)),
   eq(hrInterviewSlots.collegeId,collegeId),ne(hrInterviewSlots.status,"CANCELLED")));
 const offered=new Set(covered.filter(row=>row.status==="OFFERED"||row.status==="BOOKED").map(row=>row.roundId));
 const prepared=new Set(covered.filter(row=>row.status==="PROPOSED").map(row=>row.roundId));
 return rounds.filter(round=>!offered.has(round.id)).slice(0,8)
  .map(round=>({...round,needsOffer:prepared.has(round.id)}));
}
