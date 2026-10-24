import {NextResponse} from "next/server";
import {randomBytes} from "node:crypto";
import {getCurrentRequestContext} from "@/auth/request-context";
import {mentorGoogleConfig,mentorGoogleConsentUrl} from
 "@/modules/projects/mentor-google-calendar-provider";
import {mentorGoogleConnectionState} from
 "@/modules/projects/mentor-google-calendar-connection-service";
export const runtime="nodejs";
/** An authenticated, explicit user navigation starts Google OAuth. A signed-in
 * Mentor alone may connect their own college-scoped calendar grant.
 */
export async function GET(request:Request){
 try{
  const context=await getCurrentRequestContext();
  const status=await mentorGoogleConnectionState(context);
  const config=mentorGoogleConfig();
  if(!status.available||!config||!context.membership)
   return NextResponse.redirect(new URL("/mentor/calendar?google=unavailable",request.url));
  const nonce=randomBytes(32).toString("base64url");
  const response=NextResponse.redirect(mentorGoogleConsentUrl(config,nonce));
  response.cookies.set("mentor-google-oauth",nonce+"."+context.user.id+"."+
   context.membership.id,{path:"/api/mentor/calendar/google",httpOnly:true,
   sameSite:"lax",secure:process.env.NODE_ENV==="production",maxAge:600});
  return response;
 }catch{
  return NextResponse.redirect(new URL("/mentor/calendar?google=unavailable",request.url));
 }
}
