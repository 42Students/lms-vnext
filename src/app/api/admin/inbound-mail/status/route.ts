import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {readBoundedJsonBody} from "@/lib/bounded-json-body";
import {apiErrorResponse} from "@/lib/api-error";
import {changeInboundMailStatusForAdmin} from "@/modules/inbound-mail/admin-service";

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
  if(result.kind==="STALE")
   return NextResponse.json({error:"MESSAGE_CHANGED"},{status:409});
  if(result.kind==="UNAVAILABLE")
   return NextResponse.json({error:"INBOUND_MAIL_STORAGE_UNAVAILABLE"},{status:503});
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  return apiErrorResponse(error);
 }
}
