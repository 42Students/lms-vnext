import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {getTpoPersonalInbox} from "@/modules/activity/tpo-notifications-service";
import {countTpoUnreadRecruiterMessages} from "@/modules/placements/tpo-recruiter-unread-count-service";
import {getPendingTpoRequestsCount} from "@/modules/placements/tpo-pending-requests-count-service";
import {apiErrorResponse} from "@/lib/api-error";
export const runtime="nodejs";
export async function GET(){
 try{
  const ctx=await getCurrentRequestContext();
  const [personal,messages,requests]=await Promise.all([
   getTpoPersonalInbox(ctx,{view:"all"}),
   countTpoUnreadRecruiterMessages(ctx),
   getPendingTpoRequestsCount(ctx),
  ]);
  return NextResponse.json({notifications:personal.unreadCount,messages,requests},{
   headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
