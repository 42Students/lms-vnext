import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getInboundMailDetailForAdmin} from "@/modules/inbound-mail/admin-service";

export const runtime="nodejs";
type Params={params:Promise<{id:string}>};
/** Full plain text is available only after a separate global-Super-Admin read.
 * An unknown ID returns the same generic 404 as a deleted email. */
export async function GET(_request:Request,{params}:Params){
 try{
  const {id}=await params;
  const message=await getInboundMailDetailForAdmin(await getCurrentRequestContext(),id);
  if(!message)return NextResponse.json({error:"INBOUND_MAIL_NOT_FOUND"},{status:404,
    headers:{"Cache-Control":"private, no-store"}});
  return NextResponse.json({message},{
   headers:{"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
 }catch(error){return apiErrorResponse(error);}
}
