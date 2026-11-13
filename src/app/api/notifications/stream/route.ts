import {NextResponse} from "next/server";
import {and,count,eq} from "drizzle-orm";
import {getCurrentRequestContext} from "@/auth/request-context";
import {cookies} from "next/headers";
import {SESSION_COOKIE_NAME,verifyIdentitySessionCookie} from "@/auth/session";
import {resolveRequestContext} from "@/modules/identity/context-service";
import {canSubscribeToClassNotificationStream,notificationStreamScopeUnchanged}
 from "@/modules/activity/notification-stream-authorization";
import {apiErrorResponse} from "@/lib/api-error";
import {getDb} from "@/db/client";
import {academicPeriods,sectionEnrollments,sections} from "@/db/schema";
import {countOwnUnreadNotifications,listOwnNotifications} from "@/modules/activity/notification-service";
import { route } from "@/security/route";
import { env } from "@/config/env";
import { CACHE } from "@/security/responses";
export const runtime="nodejs";
export const dynamic="force-dynamic";

/** Per-instance burst guard; deployment ingress must additionally enforce
 * distributed 3-stream/user capacity. Never use tokens in query strings. */
const streamsByUser=new Map<string,number>();
const encoder=new TextEncoder();
const noStore={"Cache-Control":"private, no-cache, no-transform","Content-Type":"text/event-stream; charset=utf-8",
 "Connection":"keep-alive","X-Accel-Buffering":"no"};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
async function handleGET(request:Request){
 const params=new URL(request.url).searchParams;
 if(params.has("token")||params.has("access_token")||params.has("bearer")||
   params.has("authorization"))
  return NextResponse.json({error:"BEARER_QUERY_FORBIDDEN"},{status:400,
   headers:{"Cache-Control":CACHE.PRIVATE}});
 // No ambiguous duplicate keys, ignored selectors or bearer credentials.
 if([...params.keys()].some(key=>key!=="classId")||params.getAll("classId").length>1)
  return NextResponse.json({error:"INVALID_STREAM_QUERY"},{status:400,
   headers:{"Cache-Control":CACHE.PRIVATE}});
 const classId=params.get("classId");
 if(classId!==null&&!uuid.test(classId))
  return NextResponse.json({error:"INVALID_SECTION"},{status:400,
   headers:{"Cache-Control":CACHE.PRIVATE}});
 try{
  const context=await getCurrentRequestContext();
  if(context.user.platformStatus!=="ACTIVE")
   return NextResponse.json({error:"FORBIDDEN"},{status:403});
  if(classId){
   // A same-college membership is not proof of class enrollment or teaching
   // authority. Deny before even querying aggregate class size.
   if(!(await canSubscribeToClassNotificationStream(context,classId)))
    return NextResponse.json({error:"NOT_FOUND"},{status:404,
      headers:{"Cache-Control":CACHE.PRIVATE}});
   const [audience]=await getDb().select({
    collegeId:academicPeriods.collegeId,
    recipients:count(sectionEnrollments.id),
   }).from(sections)
    .innerJoin(academicPeriods,eq(academicPeriods.id,sections.academicPeriodId))
    .leftJoin(sectionEnrollments,and(
      eq(sectionEnrollments.sectionId,sections.id),
      eq(sectionEnrollments.status,"ACTIVE")))
    .where(eq(sections.id,classId))
    .groupBy(academicPeriods.collegeId).limit(1);
   const selectedCollege=context.membership?.collegeId??context.adminScope?.collegeId;
   if(!audience||audience.collegeId!==selectedCollege)
    return NextResponse.json({error:"NOT_FOUND"},{status:404,
      headers:{"Cache-Control":CACHE.PRIVATE}});
   if(audience.recipients>3000)
    return NextResponse.json({error:"CLASS_STREAM_TOO_LARGE"},{status:429,
      headers:{"Cache-Control":CACHE.PRIVATE}});
  }
  // Capture only the opaque first-party token in this short-lived server
  // closure. A session revoked after SSE upgrade must not keep receiving
  // events until the client disconnects or the 110-second timeout.
  const sessionToken=(await cookies()).get(SESSION_COOKIE_NAME)?.value??null;
  if(!sessionToken&&env.APP_ENV!=="development")
   return NextResponse.json({error:"SESSION_MISSING"},{status:401,
    headers:{"Cache-Control":CACHE.PRIVATE}});
  const key=context.user.id;
  const connections=streamsByUser.get(key)??0;
  if(connections>=3)return NextResponse.json({error:"TOO_MANY_STREAMS"},{status:429,
    headers:{"Retry-After":"30","Cache-Control":CACHE.PRIVATE}});
  streamsByUser.set(key,connections+1);
  let release=()=>{};
  const source=new ReadableStream<Uint8Array>({
   start(controller){
    let closed=false,checking=false,previous:string|null=null,sequence=0;
    const emit=(data:string)=>{if(!closed)controller.enqueue(encoder.encode(data));};
    let timer:ReturnType<typeof setInterval>|null=null;
    let expires:ReturnType<typeof setTimeout>|null=null;
    const stop=()=>{
     if(closed)return;closed=true;
     if(timer)clearInterval(timer);
     if(expires)clearTimeout(expires);
     request.signal.removeEventListener("abort",stop);
     streamsByUser.set(key,Math.max(0,(streamsByUser.get(key)??1)-1));
     if(streamsByUser.get(key)===0)streamsByUser.delete(key);
     try{controller.close();}catch{/* Reader disconnected. */}
    };
    release=stop;
    const poll=async()=>{
     if(closed||checking)return;
     checking=true;
     try{
      // Recheck the live first-party device session, not only a frozen actor
      // context. resolveSession enforces revocation, idle/absolute expiry and
      // the persisted account status using an atomic database predicate.
      // E2E impersonation is possible only in explicitly gated development.
      if(sessionToken){
       const identity=await verifyIdentitySessionCookie(sessionToken);
       if(identity.uid!==context.user.identityUid){stop();return;}
      }else if(env.APP_ENV!=="development"){stop();return;}
      // Reconstruct persisted scope before every poll. Revoke the stream on
      // role, membership, system privilege, recruiter grant or tenant change,
      // including a previously selected role silently falling back to another.
      const live=await resolveRequestContext({
       identityUid:context.user.identityUid,
       activeMembershipId:context.membership?.id??null,
       activeRole:context.membership?.roles[0]??null,
       adminScope:context.adminScope??null,
      });
      if(!notificationStreamScopeUnchanged(context,live) ||
         (classId&&!(await canSubscribeToClassNotificationStream(live,classId)))){
       stop();return;
      }
      // These queries bind the recipient's own identity, never the class's
      // recipients or another tenant's notifications.
      const [rows,unread]=await Promise.all([
       listOwnNotifications(live,{limit:1,...(classId?{classId}:{})}),
       countOwnUnreadNotifications(live),
      ]);
      const newest=rows[0]?.notification;
      const version=[newest?.id??"",newest?.readAt?.toISOString()??"",
       String(unread)].join(":");
      if(version!==previous){
       previous=version;
       emit("event: notifications\nid: "+String(++sequence)+
        "\ndata: "+JSON.stringify({unread,changed:true})+"\n\n");
      }else emit(": heartbeat\n\n");
     }catch{stop();}
     finally{checking=false;}
    };
    emit("retry: 10000\n\n");
    void poll();
    timer=setInterval(()=>{void poll();},15000);
    expires=setTimeout(stop,110000);
    request.signal.addEventListener("abort",stop,{once:true});
   },
   cancel(){release();},
  });
  return new Response(source,{headers:noStore});
 }catch(error){return apiErrorResponse(error);}
}
export const GET = route(
  { auth: "user", permission: "service-enforced", repeatableQuery: ["classId"] },
  ({ request }) => handleGET(request as Parameters<typeof handleGET>[0]),
);
