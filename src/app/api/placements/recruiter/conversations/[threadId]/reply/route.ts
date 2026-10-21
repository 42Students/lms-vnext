import {NextResponse} from "next/server";
import {z} from "zod";
import {apiErrorResponse} from "@/lib/api-error";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {hasActiveRecruiter} from "@/modules/identity/context";
import {hrRecruiterReplySchema} from "@/modules/placements/hr-conversation-reply-model";
import {openRecruiterMessageThread,sendRecruiterThreadMessage,TpoMessagingError} from "@/modules/placements/tpo-messaging-service";
export const runtime="nodejs";
export async function POST(request:Request,{params}:{params:Promise<{threadId:string}>}){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 const form=await request.formData().catch(()=>null);
 const rawThreadId=(await params).threadId;
 const openingNew=rawThreadId==="new";
 const bodyForNew=z.string().trim().min(1).max(4000).safeParse(form?.get("body"));
 const parsed=hrRecruiterReplySchema.safeParse({
  threadId:rawThreadId,body:form?.get("body"),
   quoteId:form?.get("quoteId")||undefined,
 });
 if((!openingNew&&!parsed.success)||(openingNew&&!bodyForNew.success))
  return NextResponse.json({error:"INVALID_BODY"},{status:400});
 let resolvedThreadId=rawThreadId;
 try{
  const context=await getCurrentRequestContext();
  if(!hasActiveRecruiter(context)||context.recruiter?.userId!==context.user.id)
   return NextResponse.json({error:"FORBIDDEN"},{status:403});
  if(openingNew){
   const collegeId=z.string().uuid().parse(form?.get("collegeId"));
   const rawJobId=form?.get("jobId");
   const jobId=rawJobId?z.string().uuid().parse(rawJobId):null;
   // The open and send services independently recheck persisted recruiter
   // grants and relationship-specific drive access (including expiry).
   const thread=await openRecruiterMessageThread(context,{collegeId,jobId});
   resolvedThreadId=thread.id;
  }
  const body=openingNew&&bodyForNew.success?bodyForNew.data:
   parsed.success?parsed.data.body:"";
  const quoteId=openingNew?(form?.get("quoteId")||undefined):
   parsed.success?parsed.data.quoteId:undefined;
  const receipt=await sendRecruiterThreadMessage(context,resolvedThreadId,body,quoteId);
  if(request.headers.get("accept")?.includes("application/json"))
   return NextResponse.json({sent:true,id:receipt.id,threadId:receipt.threadId},
    {headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  if(error instanceof TpoMessagingError)
   return NextResponse.json({error:error.code==="TPO_MESSAGE_FORBIDDEN"?"FORBIDDEN":"NOT_FOUND"},
    {status:error.code==="TPO_MESSAGE_FORBIDDEN"?403:404});
  if(error instanceof z.ZodError)
   return NextResponse.json({error:"INVALID_BODY"},{status:400});
  return apiErrorResponse(error);
 }
 return NextResponse.redirect(new URL("/hr/conversations/"+resolvedThreadId,request.url),303);
}
