import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {readHrRecruiterBell,markHrRecruiterBellRead,countHrRecruiterBellUnread} from "@/modules/placements/hr-recruiter-bell-service";
export const runtime="nodejs";
export async function GET(request:Request){
 try{
  const context=await getCurrentRequestContext();
  if(new URL(request.url).searchParams.get("countOnly")==="1"){
   const count=await countHrRecruiterBellUnread(context);
   return NextResponse.json({...count,ok:true},{headers:{"Cache-Control":"private, no-store"}});
  }
  const data=await readHrRecruiterBell(context);
  return NextResponse.json({...data,ok:true,
    unreadCount:data.unread,refreshAfterMs:30_000,
    // Modern routes keep request-context college grants and event ACLs.
    links:{feed:"/api/placements/recruiter/bell",
      drawer:"/api/placements/recruiter/notifications/drawer",
      notifications:"/hr/notifications"},
   },{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
export async function POST(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const data=await markHrRecruiterBellRead(await getCurrentRequestContext());
  return NextResponse.json({...data,ok:true},{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
/** Legacy PUT /notifications/mark-all-read uses the same scoped writer. */
export const PUT=POST;
