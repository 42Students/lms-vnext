import {NextResponse} from "next/server";
import {timingSafeEqual} from "node:crypto";
import {cookies} from "next/headers";
import {getCurrentRequestContext} from "@/auth/request-context";
import {mentorGoogleConfig,mentorGoogleExchangeCode} from
 "@/modules/projects/mentor-google-calendar-provider";
import {saveMentorGoogleConnection} from
 "@/modules/projects/mentor-google-calendar-connection-service";
export const runtime="nodejs";
const oauthCookie="mentor-google-oauth";
export async function GET(request:Request){
 const target=new URL("/mentor/calendar",request.url);
 const response=(status:"connected"|"failed")=>{
  target.searchParams.set("google",status);
  const redirect=NextResponse.redirect(target);
  redirect.cookies.set(oauthCookie,"",{maxAge:0,path:"/api/mentor/calendar/google",
    httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax"});
  return redirect;
 };
 try{
  const context=await getCurrentRequestContext();
  if(!context.membership)return response("failed");
  const query=new URL(request.url).searchParams;
  const state=query.get("state"),code=query.get("code"),cookie=
   (await cookies()).get(oauthCookie)?.value;
  if(!state||!code||!cookie||query.getAll("code").length!==1||
     query.getAll("state").length!==1||state.length!==43||
     !/^[A-Za-z0-9_-]{43}$/.test(state))return response("failed");
  const expected=state+"."+context.user.id+"."+context.membership.id;
  const actual=Buffer.from(cookie),required=Buffer.from(expected);
  if(actual.length!==required.length||!timingSafeEqual(actual,required))
   return response("failed");
  const config=mentorGoogleConfig();
  if(!config)return response("failed");
  const token=await mentorGoogleExchangeCode(config,code);
  if(!token.refreshToken)return response("failed");
  await saveMentorGoogleConnection(context,token.refreshToken);
  return response("connected");
 }catch{return response("failed");}
}
