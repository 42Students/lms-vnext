import {NextResponse} from "next/server";
import {z} from "zod";
import {apiErrorResponse} from "@/lib/api-error";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {hasActiveRecruiter} from "@/modules/identity/context";
import {acknowledgeRecruiterThreads,TpoMessagingError} from "@/modules/placements/tpo-messaging-service";
import {recruiterInboxReturnUrl} from "@/modules/placements/hr-conversation-return-url-model";
export const runtime="nodejs";
export async function POST(request:Request){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 const form=await request.formData().catch(()=>null);
 if(!form)return NextResponse.json({error:"INVALID_BODY"},{status:400});
 try{
  const context=await getCurrentRequestContext();
  if(!hasActiveRecruiter(context))
   return NextResponse.json({error:"FORBIDDEN"},{status:403});
  await acknowledgeRecruiterThreads(context,form.getAll("threadId"));
  const destination=recruiterInboxReturnUrl(form.get("returnTo"),request.url);
  return NextResponse.redirect(destination,303);
 }catch(error){
  if(error instanceof z.ZodError)
   return NextResponse.json({error:"INVALID_SELECTION"},{status:400});
  if(error instanceof TpoMessagingError)
   return NextResponse.json({error:error.code==="TPO_MESSAGE_FORBIDDEN"?"FORBIDDEN":"NOT_FOUND"},
    {status:error.code==="TPO_MESSAGE_FORBIDDEN"?403:404});
  return apiErrorResponse(error);
 }
}
