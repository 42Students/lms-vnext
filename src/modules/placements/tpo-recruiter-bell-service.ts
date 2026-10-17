import "server-only";
import {and,eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships,inAppNotifications,membershipRoles,users} from "@/db/schema";
type TpoRecruiterBellTx=Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];

/** TPO-inbox-team-60: deliver only a committed, college-scoped placement
 * audit event to currently active placement officers. No learner, recruiter,
 * or former TPO gets the private recipient stream. */
export async function notifyActiveTposOfRecruiterEvent(
 tx:TpoRecruiterBellTx,input:{collegeId:string;eventId:string;title:string;body:string;leadId:string},
){
 const recipients=await tx.selectDistinct({userId:collegeMemberships.userId})
  .from(collegeMemberships)
  .innerJoin(users,eq(users.id,collegeMemberships.userId))
  .innerJoin(membershipRoles,and(
   eq(membershipRoles.membershipId,collegeMemberships.id),
   eq(membershipRoles.role,"TPO")))
  .where(and(eq(collegeMemberships.collegeId,input.collegeId),
   eq(collegeMemberships.status,"ACTIVE"),
   eq(users.platformStatus,"ACTIVE"))).limit(501);
 if(recipients.length>500)throw new Error("TPO_NOTIFICATION_RECIPIENT_LIMIT");
 if(!recipients.length)return 0;
 await tx.insert(inAppNotifications).values(recipients.map(({userId})=>({
  userId,eventId:input.eventId,title:input.title.slice(0,120),
  body:input.body.slice(0,300),actionHref:"/tpo/recruiters?lead="+encodeURIComponent(input.leadId),
 }))).onConflictDoNothing();
 return recipients.length;
}
