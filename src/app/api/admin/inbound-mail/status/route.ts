import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {readBoundedJsonBody} from "@/lib/bounded-json-body";
import {apiErrorResponse} from "@/lib/api-error";
import {changeInboundMailStatusForAdmin,getInboundMailDetailForAdmin} from "@/modules/inbound-mail/admin-service";

export const runtime="nodejs";
export async function PATCH(request:Request){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const body=await readBoundedJsonBody(request,8192);
  if(body.kind!=="OK")return NextResponse.json({error:"INVALID_BODY"},
   {status:body.kind==="TOO_LARGE"?413:400,headers:{"Cache-Control":"private, no-store"}});
  const context=await getCurrentRequestContext();
  const result=await changeInboundMailStatusForAdmin(context,body.value);
  if(result.kind==="STALE") {
   // The already-authorized service validated the ID and mutation scope.
   // Re-read under that same global Super Admin guard: absent is 404, while
   // changed status/version is a retryable 409. Never expose mail contents.
   const id=(body.value as {id?:unknown}).id;
   const current=await getInboundMailDetailForAdmin(context,id);
   if(!current)return NextResponse.json({error:"MESSAGE_NOT_FOUND",
     message:"This message could not be found. Reload the inbox."},{status:404});
   return NextResponse.json({error:"MESSAGE_CHANGED",
     message:"This message changed. Reload it and try again."},{status:409});
  }
  if(result.kind==="UNAVAILABLE")
   return NextResponse.json({error:"INBOUND_MAIL_STORAGE_UNAVAILABLE"},{status:503});
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  return apiErrorResponse(error);
 }
}
