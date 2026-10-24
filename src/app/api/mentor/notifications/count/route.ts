import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getMentorPersonalInbox} from
  "@/modules/activity/mentor-notifications-service";
import {announcementsRuntimeEnabled} from "@/modules/announcements/readiness";
import {listVisibleAnnouncementsForMembership} from
  "@/modules/announcements/service";
import {resolveOptionalModuleAccess} from "@/modules/module-access/service";
import {listMyMentorProjectAttention} from
  "@/modules/projects/mentor-attention-service";
import {listOwnMentorSourceReceipts} from
  "@/modules/projects/mentor-notification-source-receipts-service";
import {mentorAttentionReceiptKey,mentorAnnouncementReceiptKey}
  from "@/modules/projects/mentor-attention-read-model";

export const runtime="nodejs";
/** Bell count shares exactly the signed-in user's persisted read receipts.
 * A full-college notice count is not invented if the notice feed is paged.
 */
export async function GET(){
 try{
  const context=await getCurrentRequestContext();
  const inbox=await getMentorPersonalInbox(context,{view:"all"});
  const access=await resolveOptionalModuleAccess(context);
  const [alerts,notices]=await Promise.all([
    access.projects.enabled?
      listMyMentorProjectAttention(context):Promise.resolve([]),
    announcementsRuntimeEnabled()?
      listVisibleAnnouncementsForMembership(context):Promise.resolve([]),
  ]);
  const keys=[...alerts.map(mentorAttentionReceiptKey),
    ...notices.map(mentorAnnouncementReceiptKey)];
  const read=await listOwnMentorSourceReceipts(context,keys);
  const sourceUnread=keys.filter(key=>!read.has(key)).length;
  const count=inbox.unreadCount+sourceUnread;
  return NextResponse.json({unreadCount:count,
    loadedSourceUnread:sourceUnread,
    /** Source notices return at most 100 newest at a time. */
    partial:announcementsRuntimeEnabled()&&notices.length>=100,
  },{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
