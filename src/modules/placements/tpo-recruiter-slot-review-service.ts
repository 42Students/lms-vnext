import "server-only";
import {and,asc,eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {placementJobs,placementJobRounds} from "@/db/schema";
import {hrInterviewSlots} from "@/db/schema/placement-hr-interview-slots";
import {requireTpoJobCollege} from "./tpo-job-write-base";
import {PlacementsServiceError} from "./errors";
import type {RequestContext} from "@/modules/identity/context";
import {z} from "zod";

/** REC-home-drives-48 / R01: the TPO can inspect employer-proposed slots;
 * internal BOOKED is not a placement-cell confirmation of students or rooms. */
export async function listTpoRecruiterProposedSlots(context:RequestContext,rawJobId:unknown){
 const jobId=z.string().uuid().parse(rawJobId);
 const collegeId=await requireTpoJobCollege(context);
 const [job]=await getDb().select({id:placementJobs.id,status:placementJobs.status,
  title:placementJobs.title}).from(placementJobs).where(and(
   eq(placementJobs.id,jobId),eq(placementJobs.collegeId,collegeId))).limit(1);
 if(!job)throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
 const rows=await getDb().select({
  id:hrInterviewSlots.id,roundId:hrInterviewSlots.roundId,
  roundName:placementJobRounds.name,
  startAt:hrInterviewSlots.startAt,endAt:hrInterviewSlots.endAt,
  status:hrInterviewSlots.status,version:hrInterviewSlots.version,
  timezone:hrInterviewSlots.timezone,mode:hrInterviewSlots.mode,
  meetingLocation:hrInterviewSlots.meetingLocation,
  panelLabel:hrInterviewSlots.panelLabel,
  capacity:hrInterviewSlots.capacity,bookedCount:hrInterviewSlots.bookedCount,
 }).from(hrInterviewSlots).innerJoin(placementJobRounds,and(
  eq(placementJobRounds.id,hrInterviewSlots.roundId),
  eq(placementJobRounds.jobId,hrInterviewSlots.jobId),
 )).where(and(eq(hrInterviewSlots.jobId,jobId),
  eq(hrInterviewSlots.collegeId,collegeId)))
  .orderBy(asc(hrInterviewSlots.startAt)).limit(200);
 return {job,collegeId,slots:rows,capReached:rows.length===200};
}
