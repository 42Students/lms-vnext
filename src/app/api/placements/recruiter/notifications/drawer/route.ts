import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {listHrNotifications} from "@/modules/placements/hr-notifications-service";
import {apiErrorResponse} from "@/lib/api-error";
export const runtime="nodejs";

/** Legacy RecruiterSelfController notifications crosswalk:
 * GET  /api/v1/recruiter/notifications           -> GET drawer
 * GET  /api/v1/recruiter/notifications/unread-count -> GET bell?countOnly=1
 * PUT  /api/v1/recruiter/notifications/mark-all-read -> PUT bell
 * The drawer and bell both read scoped in-app notification receipts. The
 * mark-all writer verifies the same authorized employer/college drive set.
 */
export async function GET(request:Request){
 try{
  const url=new URL(request.url);
  const collegeId=url.searchParams.get("collegeId")??undefined;
  const context=await getCurrentRequestContext();
  const result=await listHrNotifications(context,{
   collegeId,
   unreadOnly:url.searchParams.get("unreadOnly")??"false",
   page:url.searchParams.get("page")??1,
   q:url.searchParams.get("q")??"",
  });
  return NextResponse.json({...result,
   feed:result.rows,
   unreadCount:result.unread,
   links:{
    bell:"/api/placements/recruiter/bell",
    unreadCount:"/api/placements/recruiter/bell?countOnly=1",
    markAllRead:"/api/placements/recruiter/bell",
    markAllMethod:"PUT",
    notifications:"/hr/notifications",
   },
  },{headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiErrorResponse(e);}
}
