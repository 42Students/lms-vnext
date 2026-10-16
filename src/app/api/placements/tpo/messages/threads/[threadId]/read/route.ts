import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {hasMembershipRole} from "@/modules/identity/context";
import {listThreadMessages,TpoMessagingError} from "@/modules/placements/tpo-messaging-service";
const confirm=z.strictObject({confirmed:z.literal(true)});
export const runtime="nodejs";
/** POST is the only TPO read acknowledgement; GET remains read-only. */
export async function POST(request:Request,{params}:{params:Promise<{threadId:string}>}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 const body=confirm.safeParse(await request.json().catch(()=>null));
 const id=z.string().uuid().safeParse((await params).threadId);
 if(!body.success||!id.success)return NextResponse.json({error:"INVALID_BODY"},{status:400});
 const context=await getCurrentRequestContext();
 if(!context.membership||!hasMembershipRole(context,"TPO"))
  return NextResponse.json({error:"FORBIDDEN"},{status:403});
 try{
  await listThreadMessages(context,id.data);
  return NextResponse.json({acknowledged:true},{headers:{"Cache-Control":"no-store"}});
 }catch(error){
  if(error instanceof TpoMessagingError)return NextResponse.json({error:"THREAD_NOT_FOUND"},{status:404});
  throw error;
 }
}
