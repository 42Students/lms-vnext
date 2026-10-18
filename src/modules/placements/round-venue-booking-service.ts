import "server-only";
import {and,eq,ne,sql} from "drizzle-orm";
import {placementJobRounds,placementJobs} from "@/db/schema";
import {PlacementsServiceError} from "./errors";
import type {TpoJobTx} from "./tpo-job-write-base";
import {overlappingInterviewVenue} from "./tpo-interview-reschedule-model";
/** All round scheduling writers share this transaction-scoped venue lock. */
export async function requireAvailableRoundVenue(tx:TpoJobTx,input:{
 collegeId:string;roundId:string;venue:string;start:Date;durationMinutes:number|null;
}){
 const venue=input.venue.trim().toLowerCase();
 if(!venue||!Number.isSafeInteger(input.durationMinutes)||input.durationMinutes===null||
    input.durationMinutes<=0||input.durationMinutes>1440||!Number.isFinite(input.start.getTime()))
  throw new PlacementsServiceError("PLACEMENT_ROUND_INVALID_TRANSITION");
 await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${input.collegeId}::text || '|' || ${venue}::text))`);
 const competitors=await tx.select({scheduledAt:placementJobRounds.scheduledAt,
  durationMinutes:placementJobRounds.durationMinutes})
  .from(placementJobRounds).innerJoin(placementJobs,eq(placementJobs.id,placementJobRounds.jobId))
  .where(and(eq(placementJobs.collegeId,input.collegeId),eq(placementJobs.status,"PUBLISHED"),
   ne(placementJobRounds.id,input.roundId),eq(placementJobRounds.status,"SCHEDULED"),
   eq(placementJobRounds.mode,"ON_CAMPUS"),sql`lower(btrim(${placementJobRounds.venue})) = ${venue}`))
  .limit(1001);
 if(competitors.length>1000||competitors.some(row=>row.scheduledAt===null)||
  overlappingInterviewVenue(input.start,input.durationMinutes,competitors.flatMap(row=>
   row.scheduledAt?[{start:row.scheduledAt,durationMinutes:row.durationMinutes}]:[])))
  throw new PlacementsServiceError("PLACEMENT_ROUND_VENUE_CONFLICT");
}
