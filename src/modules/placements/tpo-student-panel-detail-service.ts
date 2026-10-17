import "server-only";
import {and,desc,eq,inArray} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {collegeMemberships,membershipRoles,placementApplications,
 placementJobs,placementLearnerRequests,users} from "@/db/schema";
import {placementApplicationNotes} from "@/db/schema/placement-application-notes";
import {hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {requirePlacementManageScope} from "./scope";

export async function getTpoStudentPanelDetail(ctx:RequestContext,raw:unknown){
 const id=z.uuid().parse(raw),membership=ctx.membership;
 if(!membership||!hasMembershipRole(ctx,"TPO")||membership.status!=="ACTIVE")
  throw new AuthorizationError("placements.manage");
 const college=await requirePlacementManageScope(ctx,membership.collegeId);
 const db=getDb();
 const [student]=await db.select({id:collegeMemberships.id,name:users.displayName})
  .from(collegeMemberships)
  .innerJoin(users,eq(users.id,collegeMemberships.userId))
  .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),
    eq(membershipRoles.role,"LEARNER")))
  .where(and(eq(collegeMemberships.id,id),eq(collegeMemberships.collegeId,college.id)))
  .limit(1);
 if(!student)return null;
 const applications=await db.select({id:placementApplications.id,jobId:placementJobs.id,
  title:placementJobs.title}).from(placementApplications)
  .innerJoin(placementJobs,and(eq(placementJobs.id,placementApplications.jobId),
    eq(placementJobs.collegeId,college.id)))
  .where(eq(placementApplications.membershipId,id)).limit(1000);
 const applicationIds=applications.map(x=>x.id);
 if(!applicationIds.length)return {student,requests:[],notes:[],truncated:false};
 const [requests,notes]=await Promise.all([
  db.select({id:placementLearnerRequests.id,applicationId:placementLearnerRequests.applicationId,
   status:placementLearnerRequests.status,type:placementLearnerRequests.requestType,
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
 ]);
 const jobs=new Map(applications.map(x=>[x.id,x.title]));
 return {student,requests:requests.map(x=>({...x,job:jobs.get(x.applicationId)??"Drive"})),
  notes:notes.map(x=>({...x,job:jobs.get(x.applicationId)??"Drive"})),
  truncated:applications.length===1000||requests.length===100||notes.length===100};
}
