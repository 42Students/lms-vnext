import {NextResponse} from "next/server";
import {z} from "zod";
import {apiErrorResponse} from "@/lib/api-error";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {hasActiveRecruiter} from "@/modules/identity/context";
import {hrOpenRecruiterConversationSchema} from "@/modules/placements/hr-conversation-open-model";
import {openRecruiterMessageThread,composeAndSendRecruiterThreadMessage,TpoMessagingError} from "@/modules/placements/tpo-messaging-service";
export const runtime="nodejs";
export async function POST(request:Request){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 const form=await request.formData().catch(()=>null);
 const payload=hrOpenRecruiterConversationSchema.safeParse({
  collegeId:form?.get("collegeId"),jobId:form?.get("jobId")||undefined,
  message:form?.get("message")||undefined,
 });
 if(!payload.success)return NextResponse.json({error:"INVALID_BODY"},{status:400});
 try{
  const context=await getCurrentRequestContext();
  if(!hasActiveRecruiter(context)||context.recruiter?.userId!==context.user.id)
   return NextResponse.json({error:"FORBIDDEN"},{status:403});
  const thread=payload.data.message
    ?await composeAndSendRecruiterThreadMessage(context,payload.data)
    :await openRecruiterMessageThread(context,payload.data);
  return NextResponse.redirect(new URL("/hr/conversations/"+thread.id,request.url),303);
 }catch(error){
  if(error instanceof TpoMessagingError)
   return NextResponse.json({error:error.code==="TPO_MESSAGE_FORBIDDEN"?"FORBIDDEN":"NOT_FOUND"},
    {status:error.code==="TPO_MESSAGE_FORBIDDEN"?403:404});
  if(error instanceof z.ZodError)return NextResponse.json({error:"INVALID_BODY"},{status:400});
  return apiErrorResponse(error);
 }
}
