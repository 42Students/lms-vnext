import {NextResponse} from "next/server";
import {isSameOriginRequest} from "@/auth/origin";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {disconnectMentorGoogleConnection} from
 "@/modules/projects/mentor-google-calendar-connection-service";
export const runtime="nodejs";
export async function POST(request:Request){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  await disconnectMentorGoogleConnection(await getCurrentRequestContext());
  return NextResponse.json({connected:false},{
   headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
