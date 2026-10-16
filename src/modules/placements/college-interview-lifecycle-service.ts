import "server-only";
import {and,eq,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {activityEvents,colleges,placementJobs} from "@/db/schema";
import {placementCollegeInterviews as interviews} from "@/db/schema/placement-college-interviews";
import type {RequestContext} from "@/modules/identity/context";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {requireCollegePlacementAdmin} from "./college-drive-read-service";
import {placementTableExists} from "./staged-tables";
export class CollegeInterviewLifecycleError extends Error{
 constructor(readonly code:"INTERVIEW_STORAGE_PENDING"|"INTERVIEW_STALE"){
  super(code);this.name="CollegeInterviewLifecycleError";
 }
}
const input=z.strictObject({id:z.uuid(),expectedVersion:z.number().int().positive(),
 status:z.enum(["COMPLETED","NO_SHOW"])});
export async function finishCollegeInterview(ctx:RequestContext,raw:unknown){
 const parsed=input.parse(raw),collegeId=await requireCollegePlacementAdmin(ctx);
 if(!await placementTableExists("placement_college_interviews"))
  throw new CollegeInterviewLifecycleError("INTERVIEW_STORAGE_PENDING");
 return getDb().transaction(async tx=>{
  const [college]=await tx.select({organizationId:colleges.organizationId})
   .from(colleges).where(and(eq(colleges.id,collegeId),eq(colleges.status,"ACTIVE"))).limit(1);
  if(!college)throw new CollegeInterviewLifecycleError("INTERVIEW_STALE");
  await assertPersistedPlatformPermission(tx,ctx,"placements.manage",{
   collegeId,organizationId:college.organizationId,
  });
  const [record]=await tx.select({id:interviews.id,jobId:interviews.jobId,applicationId:interviews.applicationId,
   version:interviews.version}).from(interviews)
   .innerJoin(placementJobs,and(eq(placementJobs.id,interviews.jobId),eq(placementJobs.collegeId,collegeId)))
   .where(and(eq(interviews.id,parsed.id),eq(interviews.status,"SCHEDULED"),
    eq(interviews.version,parsed.expectedVersion))).for("update",{of:interviews}).limit(1);
  if(!record)throw new CollegeInterviewLifecycleError("INTERVIEW_STALE");
  await tx.update(interviews).set({status:parsed.status,completedAt:new Date(),
   version:sql`${interviews.version}+1`,updatedByUserId:ctx.user.id,updatedAt:new Date()})
   .where(eq(interviews.id,record.id));
  await tx.insert(activityEvents).values({module:"PLACEMENTS",eventType:"placements.college_interview.completed",
   actorUserId:ctx.user.id,actorMembershipId:ctx.membership?.id,
   collegeId,organizationId:college.organizationId,subjectType:"placement_college_interview",subjectId:record.id,
   summary:parsed.status==="COMPLETED"?"College interview completed":"College interview marked no-show",
   metadata:{jobId:record.jobId,applicationId:record.applicationId,status:parsed.status},
  });
  return {id:record.id,status:parsed.status,version:record.version+1};
 });
}
