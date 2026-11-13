import { boundedRequestJson } from "@/lib/request-body";
import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {openTpoMessageThread,sendThreadMessage,TpoMessagingError} from "@/modules/placements/tpo-messaging-service";
import {hasMembershipRole} from "@/modules/identity/context";
import { route } from "@/security/route";
import { ROLE } from "@/modules/identity/roles";
import { CACHE } from "@/security/responses";
const input=z.strictObject({
 recruiterUserId:z.string().uuid(),
 jobId:z.string().uuid().nullable().optional(),
 body:z.string().trim().min(1).max(4000).optional(),
});
export const runtime="nodejs";
async function handlePOST(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 const parsed=input.safeParse(await boundedRequestJson(request).catch(()=>null));
 if(!parsed.success)return NextResponse.json({error:"INVALID_BODY"},{status:400});
 const context=await getCurrentRequestContext(),membership=context.membership;
 if(!membership||!hasMembershipRole(context,ROLE.TPO))
  return NextResponse.json({error:"FORBIDDEN"},{status:403});
 try{
  const {body,...threadInput}=parsed.data;
  const thread=await openTpoMessageThread(context,{
   collegeId:membership.collegeId,recruiterUserId:threadInput.recruiterUserId,
   ...(threadInput.jobId !== undefined ? {jobId:threadInput.jobId} : {}),
  });
  // Opening a conversation alone never sends or notifies. When an explicit
  // message is provided, reuse the audited, persisted send service; it owns
  // the notification. Do not claim it was sent before the write succeeds.
  if(body){
   const message=await sendThreadMessage(context,thread.id,body);
   if(!message)return NextResponse.json({error:"MESSAGE_NOT_CREATED"},{status:500});
   return NextResponse.json({
    threadId:thread.id,messageId:message.id,messageSent:true,action:"MESSAGE_SENT",
   },{status:201,headers:{"Cache-Control":CACHE.PRIVATE}});
  }
  return NextResponse.json({
   threadId:thread.id,messageSent:false,action:"THREAD_OPENED",
   sendHref:"/api/placements/tpo/messages/threads/"+thread.id+"/messages",
  },{status:201,headers:{"Cache-Control":CACHE.PRIVATE}});
 }catch(error){
  if(error instanceof TpoMessagingError)return NextResponse.json({error:"RECRUITER_ACCESS_UNAVAILABLE"},{status:404});
  throw error;
 }
}
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  ({ request }) => handlePOST(request as Parameters<typeof handlePOST>[0]),
);
