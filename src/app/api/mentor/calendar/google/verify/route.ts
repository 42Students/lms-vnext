import {NextResponse} from "next/server";
import {isSameOriginRequest} from "@/auth/origin";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getMentorGoogleAccessToken,mentorGoogleConnectionState}
 from "@/modules/projects/mentor-google-calendar-connection-service";
export const runtime="nodejs";
const headers={"Cache-Control":"private, no-store"};

/** Explicit, same-origin check of a refreshable Google grant. Never return
 * access/refresh tokens to the browser or call Google on page render. */
export async function POST(request:Request){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403,headers});
 let context:Awaited<ReturnType<typeof getCurrentRequestContext>>;
 try{
  context=await getCurrentRequestContext();
  const state=await mentorGoogleConnectionState(context);
  if(!state.available||!state.connected)
   return NextResponse.json({verified:false,error:"GOOGLE_CALENDAR_NOT_CONNECTED"},
    {status:409,headers});
 }catch(error){return apiErrorResponse(error);}
 try{
  const token=await getMentorGoogleAccessToken(context);
  if(!token.accessToken)throw new Error("GOOGLE_CALENDAR_TOKEN_MISSING");
  return NextResponse.json({verified:true},{headers});
 }catch{
  return NextResponse.json({verified:false,error:"GOOGLE_CALENDAR_VERIFICATION_FAILED"},
   {status:502,headers});
 }
}
