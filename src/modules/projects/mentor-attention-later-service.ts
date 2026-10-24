import "server-only";
import {createHash} from "node:crypto";
import {and,eq,inArray,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {activityEvents} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requirePersistedMentorInboxMembership} from
 "@/modules/activity/mentor-notifications-service";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {ProjectsServiceError} from "./errors";
import {listMyMentorProjectAttention} from "./mentor-attention-service";
import {mentorAttentionReceiptKey} from "./mentor-attention-read-model";
import type {MentorProjectAttention} from "./mentor-attention";

const LATER_EVENT=ACTIVITY_EVENT_TYPES.IDENTITY_MENTOR_NOTIFICATION_ACKNOWLEDGED;
const LATER_SUBJECT="mentor_project_attention_later";
const keySchema=z.string().min(8).max(320).startsWith("attention:");

export async function listOwnMentorAttentionLater(
 context:RequestContext,alerts:readonly MentorProjectAttention[],
):Promise<string[]>{
 const membership=await requirePersistedMentorInboxMembership(context);
 const keys=[...new Set(alerts.map(mentorAttentionReceiptKey))];
 if(!keys.length)return [];
 const seen=new Set<string>();
 for(let offset=0;offset<keys.length;offset+=100){
   const rows=await getDb().select({key:activityEvents.subjectId})
     .from(activityEvents).where(and(
       eq(activityEvents.actorUserId,context.user.id),
       eq(activityEvents.collegeId,membership.collegeId),
       eq(activityEvents.subjectType,LATER_SUBJECT),
       eq(activityEvents.eventType,LATER_EVENT),
       inArray(activityEvents.subjectId,keys.slice(offset,offset+100)),
     ));
   for(const row of rows)seen.add(row.key);
 }
 return [...seen];
}
/** Source validity is recomputed on every action; no tenant, recipient, source
 * event or timestamp is trusted from the browser. This event/version key
 * expires naturally when the underlying alert revision changes.
 */
export async function markOwnMentorAttentionLater(
 context:RequestContext,keyRaw:unknown,
):Promise<{hidden:true}>{
 const key=keySchema.parse(keyRaw);
 const membership=await requirePersistedMentorInboxMembership(context);
 const alerts=await listMyMentorProjectAttention(context);
 if(!alerts.some(alert=>mentorAttentionReceiptKey(alert)===key))
   throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
 const hash=createHash("sha256").update(key).digest("hex");
 await getDb().transaction(async tx=>{
   await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${context.user.id}, 43))`);
   const [existing]=await tx.select({id:activityEvents.id})
     .from(activityEvents).where(and(
       eq(activityEvents.actorUserId,context.user.id),
       eq(activityEvents.collegeId,membership.collegeId),
       eq(activityEvents.eventType,LATER_EVENT),
       eq(activityEvents.subjectType,LATER_SUBJECT),
       eq(activityEvents.subjectId,key),
     )).limit(1);
   if(existing)return;
   await recordActivityEventInTransaction(tx,context,{
     eventType:LATER_EVENT,
     organizationId:membership.organizationId,collegeId:membership.collegeId,
     subjectType:LATER_SUBJECT,subjectId:key,
     summary:"Mentor project attention postponed until source revision",
     metadata:{source:"MENTOR_ATTENTION_LATER"},
     groupKey:"mentor:attention:"+context.user.id,
     dedupeKey:"mentor:later:"+context.user.id+":"+hash,
   });
 });
 return {hidden:true};
}
