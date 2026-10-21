import {NextResponse} from "next/server";
import {and,count,eq} from "drizzle-orm";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getDb} from "@/db/client";
import {academicPeriods,sectionEnrollments,sections} from "@/db/schema";
import {countOwnUnreadNotifications,listOwnNotifications} from "@/modules/activity/notification-service";
export const runtime="nodejs";
export const dynamic="force-dynamic";

/** Per-instance burst guard; deployment ingress must additionally enforce
 * distributed 3-stream/user capacity. Never use tokens in query strings. */
const streamsByUser=new Map<string,number>();
const encoder=new TextEncoder();
const noStore={"Cache-Control":"private, no-cache, no-transform","Content-Type":"text/event-stream; charset=utf-8",
 "Connection":"keep-alive","X-Accel-Buffering":"no"};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export async function GET(request:Request){
 const params=new URL(request.url).searchParams;
 if(params.has("token")||params.has("access_token")||params.has("bearer")||
   params.has("authorization"))
  return NextResponse.json({error:"BEARER_QUERY_FORBIDDEN"},{status:400});
 try{
  const context=await getCurrentRequestContext();
  if(context.user.platformStatus!=="ACTIVE")
   return NextResponse.json({error:"FORBIDDEN"},{status:403});
  const classId=params.get("classId");
  if(classId){
   if(!uuid.test(classId)||!context.membership)
    return NextResponse.json({error:"INVALID_SECTION"},{status:400});
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
   if(!audience||audience.collegeId!==context.membership.collegeId)
    return NextResponse.json({error:"NOT_FOUND"},{status:404});
   if(audience.recipients>3000)
    return NextResponse.json({error:"CLASS_STREAM_TOO_LARGE"},{status:429,
      headers:{"Cache-Control":"private, no-store"}});
  }
  const key=context.user.id;
  const connections=streamsByUser.get(key)??0;
  if(connections>=3)return NextResponse.json({error:"TOO_MANY_STREAMS"},{status:429,
    headers:{"Retry-After":"30"}});
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
      // Queries always bind the authenticated user's UUID and never broadcast
      // application, contact or full notification content.
      const [rows,unread]=await Promise.all([
       listOwnNotifications(context,{limit:1,...(classId?{classId}:{})}),
       countOwnUnreadNotifications(context),
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
