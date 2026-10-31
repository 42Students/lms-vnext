import "server-only";
import {and,desc,eq,inArray} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {activityEvents,collegeMemberships,membershipRoles,placementApplications,
 placementJobs,placementLearnerRequests,users} from "@/db/schema";
import {placementApplicationNotes} from "@/db/schema/placement-application-notes";
import {listTpoStudentNotes} from "./tpo-student-notes-service";
import {hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {requirePlacementManageScope} from "./scope";
import {requireTpoBatchActor} from "./tpo-batch-workspace-read-service";

export async function getTpoStudentPanelDetail(ctx:RequestContext,raw:unknown){
 const id=z.uuid().parse(raw),membership=ctx.membership;
 if(!membership||!hasMembershipRole(ctx,"TPO")||membership.status!=="ACTIVE")
  throw new AuthorizationError("placements.manage");
 // Revalidate the persisted TPO/college-admin membership on every private read.
 const collegeId=await requireTpoBatchActor(ctx);
 const college=await requirePlacementManageScope(ctx,collegeId);
 const db=getDb();
 const [student]=await db.select({id:collegeMemberships.id,name:users.displayName})
  .from(collegeMemberships)
  .innerJoin(users,eq(users.id,collegeMemberships.userId))
  .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),
    eq(membershipRoles.role,"LEARNER")))
  .where(and(eq(collegeMemberships.id,id),eq(collegeMemberships.collegeId,college.id),
    eq(collegeMemberships.status,"ACTIVE"),eq(users.platformStatus,"ACTIVE")))
  .limit(1);
 if(!student)return null;
 const applications=await db.select({id:placementApplications.id,jobId:placementJobs.id,
  title:placementJobs.title,status:placementApplications.status}).from(placementApplications)
  .innerJoin(placementJobs,and(eq(placementJobs.id,placementApplications.jobId),
    eq(placementJobs.collegeId,college.id)))
  .where(eq(placementApplications.membershipId,id)).limit(1000);
 const applicationIds=applications.map(x=>x.id);
 const teamHistory=await db.select({id:activityEvents.id,eventType:activityEvents.eventType,
  summary:activityEvents.summary,occurredAt:activityEvents.occurredAt,
  subjectType:activityEvents.subjectType,actorUserId:activityEvents.actorUserId})
  .from(activityEvents).where(and(eq(activityEvents.collegeId,college.id),
   eq(activityEvents.subjectId,id),eq(activityEvents.module,"PLACEMENTS")))
  .orderBy(desc(activityEvents.occurredAt)).limit(100);
 if(!applicationIds.length)return {student,applications,requests:[],notes:[],studentNotes:await listTpoStudentNotes(ctx,id),teamHistory,truncated:teamHistory.length===100};
 const [requests,notes,studentNotes]=await Promise.all([
  db.select({id:placementLearnerRequests.id,applicationId:placementLearnerRequests.applicationId,
   status:placementLearnerRequests.status,type:placementLearnerRequests.requestType,
   updatedAt:placementLearnerRequests.updatedAt,
   reason:placementLearnerRequests.reason,note:placementLearnerRequests.decisionNote,
   requestedAt:placementLearnerRequests.requestedAt,
  }).from(placementLearnerRequests)
   .where(inArray(placementLearnerRequests.applicationId,applicationIds))
   .orderBy(desc(placementLearnerRequests.requestedAt)).limit(100),
  db.select({id:placementApplicationNotes.id,applicationId:placementApplicationNotes.applicationId,
   body:placementApplicationNotes.body,createdAt:placementApplicationNotes.createdAt})
   .from(placementApplicationNotes)
   .where(and(inArray(placementApplicationNotes.applicationId,applicationIds),
    eq(placementApplicationNotes.side,"TPO")))
   .orderBy(desc(placementApplicationNotes.createdAt)).limit(100),
  listTpoStudentNotes(ctx,id),
 ]);
 const jobs=new Map(applications.map(x=>[x.id,x.title]));
 return {student,applications,requests:requests.map(x=>({...x,job:(x.applicationId?jobs.get(x.applicationId):undefined)??"Drive"})),
  notes:notes.map(x=>({...x,job:(x.applicationId?jobs.get(x.applicationId):undefined)??"Drive"})),
  studentNotes:studentNotes??[],teamHistory,
  truncated:applications.length===1000||requests.length===100||notes.length===100||teamHistory.length===100};
}
