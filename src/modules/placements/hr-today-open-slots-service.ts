import "server-only";
import {and,asc,eq,gt,inArray,ne,notExists,or} from "drizzle-orm";
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
  eq(placementJobRounds.kind,"INTERVIEW"),eq(placementJobRounds.status,"SCHEDULED"),
  gt(placementJobRounds.scheduledAt,now),
  // Exclude already covered rounds *before* the bounded query. Filtering
  // after LIMIT 100 made the Today queue falsely empty when the earliest
  // hundred rounds had BOOKED/OFFERED slots but a later round needed one.
  notExists(getDb().select({id:hrInterviewSlots.id}).from(hrInterviewSlots)
   .where(and(eq(hrInterviewSlots.roundId,placementJobRounds.id),
    eq(hrInterviewSlots.collegeId,collegeId),
    or(eq(hrInterviewSlots.status,"OFFERED"),eq(hrInterviewSlots.status,"BOOKED")))))
  ))
 .orderBy(asc(placementJobRounds.scheduledAt)).limit(100);
 if(!rounds.length)return [];
 const covered=await getDb().select({roundId:hrInterviewSlots.roundId,status:hrInterviewSlots.status})
  .from(hrInterviewSlots)
  .where(and(inArray(hrInterviewSlots.roundId,rounds.map(r=>r.id)),
   eq(hrInterviewSlots.collegeId,collegeId),ne(hrInterviewSlots.status,"CANCELLED")));
 const prepared=new Set(covered.filter(row=>row.status==="PROPOSED").map(row=>row.roundId));
 return rounds.slice(0,8)
  .map(round=>({...round,needsOffer:prepared.has(round.id)}));
}
