import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {changeInboundMailStatusForAdmin,getInboundMailDetailForAdmin} from "@/modules/inbound-mail/admin-service";

export const runtime="nodejs";
type RouteContext={params:Promise<{id:string}>};

/** Historical done/reopen action translated to the vNext CAS triage state.
 * Never trust old numeric IDs, incoming version claims or a tenant selector.
 * The authorized current row provides the expected status and version. */
export async function POST(request:Request,{params}:RouteContext){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},
  {status:403,headers:{"Cache-Control":"private, no-store"}});
 try{
  const url=new URL(request.url),doneValues=url.searchParams.getAll("done");
  if([...url.searchParams.keys()].some(key=>key!=="done")||
    doneValues.length!==1||!["true","false"].includes(doneValues[0]!))
   return NextResponse.json({error:"INVALID_REQUEST",message:"Choose done or reopen."},
    {status:400,headers:{"Cache-Control":"private, no-store"}});
  const {id}=await params;
  if(!z.string().uuid().safeParse(id).success)
   return NextResponse.json({error:"MESSAGE_NOT_FOUND"},{status:404,
    headers:{"Cache-Control":"private, no-store"}});
  const context=await getCurrentRequestContext();
  const current=await getInboundMailDetailForAdmin(context,id);
  if(!current)return NextResponse.json({error:"MESSAGE_NOT_FOUND"},
   {status:404,headers:{"Cache-Control":"private, no-store"}});
  const target=doneValues[0]==="true"?"RESOLVED":"NEW";
  if(current.status===target)return NextResponse.json({
   kind:"UNCHANGED",id,status:target,version:current.version,
  },{headers:{"Cache-Control":"private, no-store"}});
  const result=await changeInboundMailStatusForAdmin(context,{
   id,expectedStatus:current.status,expectedVersion:current.version,status:target,
  });
  if(result.kind==="STALE")
   return NextResponse.json({error:"MESSAGE_CHANGED",
    message:"This message changed. Reload it and try again."},
    {status:409,headers:{"Cache-Control":"private, no-store"}});
  if(result.kind==="UNAVAILABLE")
   return NextResponse.json({error:"INBOUND_MAIL_STORAGE_UNAVAILABLE"},
    {status:503,headers:{"Cache-Control":"private, no-store"}});
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
