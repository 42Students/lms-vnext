import "server-only";
import {and,eq,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {activityEvents,colleges,collegeMemberships,inAppNotifications,membershipRoles,
 placementApplications,placementJobs,users} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {PlacementsServiceError} from "./errors";
import {requireTpoJobCollege,requireTpoJobActor} from "./tpo-job-write-base";
export const tpoApplicantBulkMessageSchema=z.strictObject({
 jobId:z.uuid(),applicationId:z.uuid(),
 expectedVersion:z.iso.datetime({offset:true}),
 body:z.string().trim().min(10).max(1000),
});
/** A message is sent only to its own ACTIVE learner, in the same transaction
 * as its audited event and the application's new version. A replay with the
 * same signed preview is rejected by the changed version. */
export async function sendTpoBulkApplicationMessage(ctx:RequestContext,raw:unknown){
 const input=tpoApplicantBulkMessageSchema.parse(raw);
 const collegeId=await requireTpoJobCollege(ctx);
 return getDb().transaction(async tx=>{
  await requireTpoJobActor(tx,ctx);
  const [candidate]=await tx.select({
   appId:placementApplications.id,version:placementApplications.updatedAt,
   recipient:users.id,jobTitle:placementJobs.title,organizationId:colleges.organizationId,
  }).from(placementApplications)
   .innerJoin(placementJobs,eq(placementJobs.id,placementApplications.jobId))
   .innerJoin(colleges,eq(colleges.id,placementJobs.collegeId))
   .innerJoin(collegeMemberships,and(eq(collegeMemberships.id,placementApplications.membershipId),
     eq(collegeMemberships.collegeId,collegeId),eq(collegeMemberships.status,"ACTIVE")))
   .innerJoin(users,and(eq(users.id,collegeMemberships.userId),eq(users.platformStatus,"ACTIVE")))
   .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),
     eq(membershipRoles.role,"LEARNER")))
   .where(and(eq(placementApplications.id,input.applicationId),
     eq(placementJobs.id,input.jobId),eq(placementJobs.collegeId,collegeId),
     eq(placementJobs.status,"PUBLISHED"),eq(placementApplications.status,"SUBMITTED")))
   .for("update",{of:placementApplications}).limit(1);
  if(!candidate||candidate.version.toISOString()!==input.expectedVersion)
   throw new PlacementsServiceError("PLACEMENT_APPLICATION_NOT_FOUND");
  await tx.update(placementApplications).set({
   updatedAt:sql`greatest(clock_timestamp(),date_trunc('milliseconds',${placementApplications.updatedAt}) + interval '1 millisecond')`,
  }).where(eq(placementApplications.id,candidate.appId));
  const [event]=await tx.insert(activityEvents).values({
   organizationId:candidate.organizationId,collegeId,
   actorUserId:ctx.user.id,actorMembershipId:ctx.membership?.id??null,
   module:"PLACEMENTS",eventType:"placements.applicant.message.sent",
   subjectType:"placement_application",subjectId:candidate.appId,
   summary:"Placement Cell sent an in-app message for "+candidate.jobTitle,
   metadata:{jobId:input.jobId,messageLength:input.body.length},
  }).returning({id:activityEvents.id});
  if(!event)throw new Error("BULK_MESSAGE_EVENT_FAILED");
  await tx.insert(inAppNotifications).values({
   userId:candidate.recipient,eventId:event.id,title:"Message from Placement Cell",
   body:input.body,actionHref:"/learn/my-placements",
  });
  return {applicationId:candidate.appId,delivered:true};
 });
}
