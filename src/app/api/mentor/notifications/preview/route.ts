import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getMentorPersonalInbox} from "@/modules/activity/mentor-notifications-service";
import {announcementsRuntimeEnabled} from "@/modules/announcements/readiness";
import {listVisibleAnnouncementsForMembership} from "@/modules/announcements/service";
import {resolveOptionalModuleAccess} from "@/modules/module-access/service";
import {listMyMentorProjectAttention} from "@/modules/projects/mentor-attention-service";
import {listOwnMentorSourceReceipts} from
 "@/modules/projects/mentor-notification-source-receipts-service";
import {mentorAttentionReceiptKey,mentorAnnouncementReceiptKey} from
 "@/modules/projects/mentor-attention-read-model";
import {sortMentorUnifiedNotifications} from
 "@/modules/projects/mentor-unified-notification-model";
export const runtime="nodejs";
/** Every source read reauthorizes the signed-in recipient, college and live
 * Mentor role. Render at most five source-owned entries in the shell.
 * Provider email/push is never inferred from this in-app preview.
 */
export async function GET(){
 try{
  const context=await getCurrentRequestContext();
  const inbox=await getMentorPersonalInbox(context,{view:"all"});
  const access=await resolveOptionalModuleAccess(context);
  const [alerts,notices]=await Promise.all([
   access.projects.enabled?listMyMentorProjectAttention(context):Promise.resolve([]),
   announcementsRuntimeEnabled()?listVisibleAnnouncementsForMembership(context):Promise.resolve([]),
  ]);
  const keys=[...alerts.map(mentorAttentionReceiptKey),
    ...notices.map(mentorAnnouncementReceiptKey)];
  const read=await listOwnMentorSourceReceipts(context,keys);
  const items=sortMentorUnifiedNotifications([
   ...inbox.page.items.map(row=>({
    id:row.notification.id,source:"PERSONAL" as const,
    title:row.notification.title,description:row.notification.body,
    occurredAt:row.notification.createdAt.toISOString(),
    actionHref:row.notification.actionHref,
    read:row.notification.readAt!==null,receiptKey:null,
   })),
   ...alerts.map(alert=>{
    const receiptKey=mentorAttentionReceiptKey(alert);
    return {id:alert.key,source:"ATTENTION" as const,title:alert.title,
      description:alert.description,occurredAt:alert.occurredAt,
      actionHref:alert.href,read:read.has(receiptKey),receiptKey};
   }),
   ...notices.map(notice=>{
    const receiptKey=mentorAnnouncementReceiptKey(notice);
    return {id:notice.id,source:"ANNOUNCEMENT" as const,title:notice.title,
      description:notice.message,occurredAt:notice.createdAt.toISOString(),
      actionHref:null,read:read.has(receiptKey),receiptKey};
   }),
  ]).slice(0,5);
  return NextResponse.json({items,hasMore:Boolean(inbox.page.nextCursor)||
    announcementsRuntimeEnabled()&&notices.length>=100||
    alerts.length+notices.length+inbox.page.items.length>5},{
      headers:{"Cache-Control":"private, no-store"},
  });
 }catch(error){return apiErrorResponse(error);}
}
