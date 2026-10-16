import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {getTpoPersonalInbox} from "@/modules/activity/tpo-notifications-service";
import {countTpoUnreadRecruiterMessages} from "@/modules/placements/tpo-recruiter-unread-count-service";
import {getPendingTpoRequestsCount} from "@/modules/placements/tpo-pending-requests-count-service";
import {apiErrorResponse} from "@/lib/api-error";
import {listMyTpoInternalThreads} from "@/modules/placements/tpo-team-internal-read-service";
export const runtime="nodejs";
export async function GET(){
 try{
  const ctx=await getCurrentRequestContext();
  const [personal,messages,requests,team]=await Promise.all([
   getTpoPersonalInbox(ctx,{view:"all"}),
   countTpoUnreadRecruiterMessages(ctx),
   getPendingTpoRequestsCount(ctx),
   listMyTpoInternalThreads(ctx),
  ]);
  return NextResponse.json({notifications:personal.unreadCount,messages,requests,
   team:team.status==="READY"?team.items.reduce((sum,item)=>sum+item.unreadCount,0):null},{
   headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
