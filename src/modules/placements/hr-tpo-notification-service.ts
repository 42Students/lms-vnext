import "server-only";
import {and,eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {activityEvents,collegeMemberships,colleges,inAppNotifications,membershipRoles,users} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";

type Tx=Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];
type Action="ROUND_CREATED"|"ROUND_UPDATED"|"ROUND_REMOVED"|"RESULT_STAGED"|"SLOT_PROPOSED"|"SLOT_OFFERED"|"SLOT_CANCELLED"|"SELECTION_LIST_SUBMITTED";
const ACTIONS:Record<Action,{eventType:string;title:string;tab:string}>={
 ROUND_CREATED:{eventType:"placements.hr_round.created",title:"A recruiter added a round",tab:"rounds"},
 ROUND_UPDATED:{eventType:"placements.hr_round.updated",title:"A recruiter updated a round",tab:"rounds"},
 ROUND_REMOVED:{eventType:"placements.hr_round.removed",title:"A recruiter removed a round",tab:"rounds"},
 RESULT_STAGED:{eventType:"placements.hr_result.staged",title:"A recruiter sent results",tab:"rounds"},
 SLOT_PROPOSED:{eventType:"placements.hr_slot.proposed",title:"A recruiter proposed interview slots",tab:"rounds"},
 SLOT_OFFERED:{eventType:"placements.hr_slot.offered",title:"A recruiter proposed interview slots",tab:"rounds"},
 SLOT_CANCELLED:{eventType:"placements.hr_slot.cancelled",title:"A recruiter cancelled interview slots",tab:"rounds"},
 SELECTION_LIST_SUBMITTED:{eventType:"placements.recruiter.selection_list_submitted",title:"A recruiter sent a selection list for verification",tab:"offers"},
};
/** REC-home-drives-R01: persist TPO activity and notification in the same
 * transaction as the authoritative recruiter action, never after commit. */
export async function notifyTpoOfRecruiterAction(tx:Tx,context:RequestContext,input:{
 collegeId:string;jobId:string;subjectId:string;action:Action;roundId?:string;
 kind?:string;count?:number;
}){
 const meta=ACTIONS[input.action];
 const [college]=await tx.select({organizationId:colleges.organizationId})
  .from(colleges).where(eq(colleges.id,input.collegeId)).limit(1);
 if(!college)return;
 const [event]=await tx.insert(activityEvents).values({
  organizationId:college.organizationId,collegeId:input.collegeId,actorUserId:context.user.id,
  module:"PLACEMENTS",eventType:meta.eventType,
  subjectType:input.action==="SELECTION_LIST_SUBMITTED"?"recruiter_selection_list":"placement_job",
  subjectId:input.action==="SELECTION_LIST_SUBMITTED"?input.subjectId:input.jobId,
  subjectLabel:meta.title,summary:meta.title,metadata:{
   jobId:input.jobId,subjectId:input.subjectId,roundId:input.roundId??null,
   source:"RECRUITER",
   ...(input.action==="SELECTION_LIST_SUBMITTED"?
     {kind:input.kind??null,count:input.count??null}:{}) ,
  },
 }).returning({id:activityEvents.id});
 if(!event)return;
 const recipients=await tx.selectDistinct({userId:collegeMemberships.userId})
  .from(collegeMemberships)
  .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),eq(membershipRoles.role,"TPO")))
  .innerJoin(users,and(eq(users.id,collegeMemberships.userId),eq(users.platformStatus,"ACTIVE")))
  .where(and(eq(collegeMemberships.collegeId,input.collegeId),eq(collegeMemberships.status,"ACTIVE")));
 if(!recipients.length)return;
 const href="/tpo/placements/jobs/"+encodeURIComponent(input.jobId)+
  (input.action.startsWith("SLOT_")?"/interview-slots":"?tab="+meta.tab);
 await tx.insert(inAppNotifications).values(recipients.map(row=>({
  userId:row.userId,eventId:event.id,title:meta.title,
  body:"Review the recruiter's update in this drive.",
  actionHref:href,
 }))).onConflictDoNothing();
}
