import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {remindUnreadTpoNotice} from "@/modules/announcements/tpo-notice-reminder-service";
export const runtime="nodejs";
export async function POST(request:Request,{params}:{params:Promise<{noticeId:string}>}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const result=await remindUnreadTpoNotice(await getCurrentRequestContext(),(await params).noticeId);
  return NextResponse.json(result);
 }catch(e){
  if(e instanceof Error&&e.message.startsWith("NOTICE_"))
   return NextResponse.json({error:e.message},{status:
    e.message==="NOTICE_NOT_FOUND"?404:e.message==="NOTICE_REMINDER_RATE_LIMIT"?429:409});
  return apiErrorResponse(e);
 }
}
