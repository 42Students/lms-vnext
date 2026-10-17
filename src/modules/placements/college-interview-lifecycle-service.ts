import "server-only";
import {and,eq} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {placementJobs} from "@/db/schema";
import {placementRoundCandidateSlots as slots} from "@/db/schema/placement-round-candidate-slots";
import type {RequestContext} from "@/modules/identity/context";
import {requireCollegePlacementAdmin} from "./college-drive-read-service";
import {mutateCollegeRoundSlotInterview} from "./college-round-slot-action-service";
export class CollegeInterviewLifecycleError extends Error{
 constructor(readonly code:"INTERVIEW_STORAGE_PENDING"|"INTERVIEW_STALE"){
  super(code);this.name="CollegeInterviewLifecycleError";
 }
}
const input=z.strictObject({id:z.uuid(),expectedVersion:z.number().int().positive(),
 status:z.enum(["COMPLETED","NO_SHOW"]),reason:z.string().trim().min(3).max(500)});
/** Global interviews use the same 0116 writer as per-drive appointments. */
export async function finishCollegeInterview(ctx:RequestContext,raw:unknown){
 const value=input.parse(raw),collegeId=await requireCollegePlacementAdmin(ctx);
 const [record]=await getDb().select({jobId:placementJobs.id})
  .from(slots).innerJoin(placementJobs,eq(placementJobs.id,slots.jobId))
  .where(and(eq(slots.id,value.id),eq(placementJobs.collegeId,collegeId))).limit(1);
 if(!record)throw new CollegeInterviewLifecycleError("INTERVIEW_STALE");
 return mutateCollegeRoundSlotInterview(ctx,record.jobId,{
  action:value.status,confirmed:true,interviewId:value.id,
  expectedVersion:value.expectedVersion,reason:value.reason,
 });
}
