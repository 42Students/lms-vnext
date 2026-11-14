import {NextResponse} from "next/server";
import {z} from "zod";
import {apiErrorResponse} from "@/lib/api-error";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {hasActiveRecruiter} from "@/modules/identity/context";
import {acknowledgeRecruiterThread,TpoMessagingError} from "@/modules/placements/tpo-messaging-service";
import { route } from "@/security/route";
import { CACHE } from "@/security/responses";
import { zUuid } from "@/lib/schema-primitives";
export const runtime="nodejs";
async function handlePOST(request:Request,{params}:{params:Promise<{threadId:string}>}){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 const id=zUuid.safeParse((await params).threadId);
 if(!id.success)return NextResponse.json({error:"NOT_FOUND"},{status:404});
 try{
  const context=await getCurrentRequestContext();
  if(!hasActiveRecruiter(context)||context.recruiter?.userId!==context.user.id)
   return NextResponse.json({error:"FORBIDDEN"},{status:403});
  const receipt=await acknowledgeRecruiterThread(context,id.data);
  // Native form submissions retain their 303. Fetch clients request a
  // persisted, thread-scoped JSON receipt before claiming read completion.
  if(request.headers.get("accept")?.includes("application/json"))
   return NextResponse.json({saved:true,threadId:id.data,acknowledged:receipt.acknowledged},
    {headers:{"Cache-Control":CACHE.PRIVATE}});
  return NextResponse.redirect(new URL("/hr/conversations/"+id.data,request.url),303);
 }catch(error){
  if(error instanceof TpoMessagingError)
   return NextResponse.json({error:error.code==="TPO_MESSAGE_FORBIDDEN"?"FORBIDDEN":"NOT_FOUND"},
    {status:error.code==="TPO_MESSAGE_FORBIDDEN"?403:404});
  return apiErrorResponse(error);
 }
}
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  ({ request, params }) => handlePOST(request as Parameters<typeof handlePOST>[0], { params: Promise.resolve(params) } as Parameters<typeof handlePOST>[1]),
);
