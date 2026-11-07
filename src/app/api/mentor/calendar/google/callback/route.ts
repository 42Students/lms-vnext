import {NextResponse} from "next/server";
import {timingSafeEqual} from "node:crypto";
import {MENTOR_GOOGLE_OAUTH_RESPONSE_HEADERS} from
 "@/modules/projects/mentor-google-oauth-response-headers";
import {cookies} from "next/headers";
import {getCurrentRequestContext} from "@/auth/request-context";
import {mentorGoogleConfig,mentorGoogleExchangeCode} from
 "@/modules/projects/mentor-google-calendar-provider";
import {saveMentorGoogleConnection} from
 "@/modules/projects/mentor-google-calendar-connection-service";
import { route } from "@/security/route";
export const runtime="nodejs";
const oauthCookie="mentor-google-oauth";
async function handleGET(request:Request){
 const target=new URL("/mentor/calendar",request.url);
 const response=(status:"connected"|"failed")=>{
  target.searchParams.set("google",status);
  const redirect=NextResponse.redirect(target,{headers:MENTOR_GOOGLE_OAUTH_RESPONSE_HEADERS});
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
  // Fail closed for legacy nonce-only cookies. The browser must present the
  // independent S256 verifier generated during this same OAuth initiation.
  const pieces=cookie.split(".");
  if(pieces.length!==4||!/^[A-Za-z0-9_-]{43}$/.test(pieces[3]??""))
   return response("failed");
  const expected=state+"."+context.user.id+"."+context.membership.id;
  const actual=Buffer.from(pieces.slice(0,3).join(".")),required=Buffer.from(expected);
  if(actual.length!==required.length||!timingSafeEqual(actual,required))
   return response("failed");
  const config=mentorGoogleConfig();
  if(!config)return response("failed");
  const token=await mentorGoogleExchangeCode(config,code,pieces[3]!);
  if(!token.refreshToken)return response("failed");
  await saveMentorGoogleConnection(context,token.refreshToken);
  return response("connected");
 }catch{return response("failed");}
}
export const GET = route(
  { auth: "public", publicReason: "OAuth redirect endpoint: the handler validates the signed state and the signed-in user itself and redirects on failure.", csrf: false, csrfExemptReason: "Redirects come from the identity provider; the handler validates state instead of Origin.", rateLimit: { limit: 3000, windowMs: 60_000 }, repeatableQuery: ["code", "state"] },
  ({ request }) => handleGET(request as Parameters<typeof handleGET>[0]),
);
