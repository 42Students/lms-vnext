import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getTpoPersonalInbox} from "@/modules/activity/tpo-notifications-service";
import {countTpoUnreadRecruiterMessages} from "@/modules/placements/tpo-recruiter-unread-count-service";
export const runtime="nodejs";
/** TPO-home-33 / TPO-inbox-team-62: own-college unread counts, no message bodies. */
export async function GET(){
 try{
  const context=await getCurrentRequestContext();
  const [inbox,messages]=await Promise.all([
   getTpoPersonalInbox(context,{view:"all"}),
   countTpoUnreadRecruiterMessages(context),
  ]);
  const items=inbox.page.items.slice(0,10).map(({notification})=>({
   id:notification.id,title:notification.title,body:notification.body,
   actionHref:notification.actionHref,readAt:notification.readAt?.toISOString()??null,
  }));
  return NextResponse.json({messages,unread:inbox.unreadCount,items},{
   headers:{"Cache-Control":"private, no-store"},
  });
 }catch(error){return apiErrorResponse(error);}
}
