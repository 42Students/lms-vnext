import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {parseMentorNotificationReadBody} from
  "@/modules/activity/mentor-notification-read-input";
import {markAllMentorUnifiedNotificationsRead} from
  "@/modules/projects/mentor-unified-notification-read-all-service";

export const runtime="nodejs";
export async function POST(request:Request){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const body=await request.text();
  if(body.length>256)return NextResponse.json({error:"INVALID_REQUEST"},{status:413});
  parseMentorNotificationReadBody(body);
  const result=await markAllMentorUnifiedNotificationsRead(
    await getCurrentRequestContext());
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
