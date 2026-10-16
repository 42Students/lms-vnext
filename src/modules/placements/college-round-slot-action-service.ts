import "server-only";
import {and,asc,eq,inArray,ne,or} from "drizzle-orm";
import {getDb} from "@/db/client";
import {activityEvents,collegeMemberships,inAppNotifications,placementApplications,
 placementApplicationScreenings,placementJobRounds,placementJobs,placementLearnerRequests,users} from "@/db/schema";
import {placementRoundCandidateSlots as slots} from "@/db/schema/placement-round-candidate-slots";
import type {RequestContext} from "@/modules/identity/context";
import {requireCollegePlacementAdmin} from "./college-drive-read-service";
import {collegeDriveIdSchema} from "./college-drive-read-model";
import {collegeInterviewActionSchema} from "./college-interview-action-model";

async function scope(ctx:RequestContext,raw:unknown){
 const collegeId=await requireCollegePlacementAdmin(ctx),jobId=collegeDriveIdSchema.parse(raw);
 const [job]=await getDb().select({id:placementJobs.id,title:placementJobs.title,
  status:placementJobs.status}).from(placementJobs).where(and(eq(placementJobs.id,jobId),
  eq(placementJobs.collegeId,collegeId))).limit(1);
 if(!job)throw Error("Placement drive not found");
 return {collegeId,job};
}
function viewSlot(s:typeof slots.$inferSelect,outcome?:string){
 const virtual=s.room.startsWith("https://");
 return {id:s.id,jobId:s.jobId,roundId:s.roundId,applicationId:s.applicationId,
  status:s.status==="CANCELLED"?"CANCELLED":outcome??"SCHEDULED",
  scheduledAt:s.startsAt.toISOString(),
  durationMinutes:Math.round((s.endsAt.getTime()-s.startsAt.getTime())/60000),
  mode:virtual?"VIRTUAL":"ON_CAMPUS",venue:virtual?null:s.room,
  meetingUrl:virtual?s.room:null,interviewer:s.panel,outcomeNote:null,
  version:s.version};
}
export async function getCollegeRoundSlotAppointments(ctx:RequestContext,raw:unknown){
 const {collegeId,job}=await scope(ctx,raw);
 const db=getDb();
 const [rounds,candidates,bookings]=await Promise.all([
  db.select({id:placementJobRounds.id,name:placementJobRounds.name,
   status:placementJobRounds.status,kind:placementJobRounds.kind})
   .from(placementJobRounds).where(and(eq(placementJobRounds.jobId,job.id),
    eq(placementJobRounds.kind,"INTERVIEW"),ne(placementJobRounds.status,"CANCELLED")))
   .orderBy(asc(placementJobRounds.sequence)),
  db.select({applicationId:placementApplications.id,name:users.displayName,
   screening:placementApplicationScreenings.status})
   .from(placementApplications)
   .innerJoin(collegeMemberships,and(eq(collegeMemberships.id,placementApplications.membershipId),
    eq(collegeMemberships.collegeId,collegeId)))
   .innerJoin(users,eq(users.id,collegeMemberships.userId))
   .innerJoin(placementApplicationScreenings,eq(placementApplicationScreenings.applicationId,placementApplications.id))
   .where(and(eq(placementApplications.jobId,job.id),eq(placementApplications.status,"SUBMITTED"),
    eq(placementApplicationScreenings.status,"SHORTLISTED"))).orderBy(asc(users.displayName)).limit(1000),
  db.select().from(slots).where(and(eq(slots.jobId,job.id),
    inArray(slots.status,["BOOKED","CANCELLED"]))).orderBy(asc(slots.startsAt)).limit(2000),
 ]);
 const ids=bookings.map(b=>b.id);
 const events=ids.length?await db.select({id:activityEvents.id,subjectId:activityEvents.subjectId,
  eventType:activityEvents.eventType,createdAt:activityEvents.createdAt})
  .from(activityEvents).where(and(eq(activityEvents.collegeId,collegeId),
    eq(activityEvents.subjectType,"placement_round_candidate_slot"),
    inArray(activityEvents.subjectId,ids),
    inArray(activityEvents.eventType,["PLACEMENTS_COLLEGE_INTERVIEW_COMPLETED",
      "PLACEMENTS_COLLEGE_INTERVIEW_NO_SHOW"])))
  .orderBy(asc(activityEvents.createdAt)): [];
 const outcomes=new Map<string,string>();
 for(const event of events)if(event.subjectId)outcomes.set(event.subjectId,
   event.eventType==="PLACEMENTS_COLLEGE_INTERVIEW_COMPLETED"?"COMPLETED":"NO_SHOW");
 return {job,storageReady:true,rounds,candidates,
  interviews:bookings.map(s=>viewSlot(s,outcomes.get(s.id)))};
}
