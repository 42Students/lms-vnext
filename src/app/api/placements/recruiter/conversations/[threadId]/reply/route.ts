import {NextResponse} from "next/server";
import {z} from "zod";
import {apiErrorResponse} from "@/lib/api-error";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {hasActiveRecruiter} from "@/modules/identity/context";
import {hrRecruiterReplySchema} from "@/modules/placements/hr-conversation-reply-model";
import {sendRecruiterThreadMessage,TpoMessagingError} from "@/modules/placements/tpo-messaging-service";
export const runtime="nodejs";
export async function POST(request:Request,{params}:{params:Promise<{threadId:string}>}){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 const form=await request.formData().catch(()=>null);
 const parsed=hrRecruiterReplySchema.safeParse({
  threadId:(await params).threadId,body:form?.get("body"),
   quoteId:form?.get("quoteId")||undefined,
 });
 if(!parsed.success)return NextResponse.json({error:"INVALID_BODY"},{status:400});
 try{
  const context=await getCurrentRequestContext();
  if(!hasActiveRecruiter(context)||context.recruiter?.userId!==context.user.id)
   return NextResponse.json({error:"FORBIDDEN"},{status:403});
  const receipt=await sendRecruiterThreadMessage(context,parsed.data.threadId,parsed.data.body,parsed.data.quoteId);
  if(request.headers.get("accept")?.includes("application/json"))
   return NextResponse.json({sent:true,id:receipt.id,threadId:receipt.threadId});
 }catch(error){
  if(error instanceof TpoMessagingError)
   return NextResponse.json({error:error.code==="TPO_MESSAGE_FORBIDDEN"?"FORBIDDEN":"NOT_FOUND"},
    {status:error.code==="TPO_MESSAGE_FORBIDDEN"?403:404});
  if(error instanceof z.ZodError)
   return NextResponse.json({error:"INVALID_BODY"},{status:400});
  return apiErrorResponse(error);
 }
 return NextResponse.redirect(new URL("/hr/conversations/"+parsed.data.threadId,request.url),303);
}
