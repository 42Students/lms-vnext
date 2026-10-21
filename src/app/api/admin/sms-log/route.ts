import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {listSupportSmsDeliveryHistory} from "@/modules/messaging/receipt-history-service";

export const runtime="nodejs";
/** POST avoids recording pasted contact details in URLs, browser history or
 * proxy access logs. The service enforces GLOBAL Super Admin access. */
export async function POST(request:Request){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const context=await getCurrentRequestContext();
  const body:unknown=await request.json();
  if(body===null||typeof body!=="object"||Array.isArray(body))
   return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
  const source=body as Record<string,unknown>;
  const rows=await listSupportSmsDeliveryHistory(context,{
   recipientSuffix:source.recipientSuffix,purpose:source.purpose,
   page:source.page,size:source.size,
  });
  return NextResponse.json(rows,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
