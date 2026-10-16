import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {hasMembershipRole} from "@/modules/identity/context";
import {sendThreadMessage,TpoMessagingError} from "@/modules/placements/tpo-messaging-service";
const schema=z.strictObject({body:z.string().trim().min(1).max(4000)});
export const runtime="nodejs";
export async function POST(request:Request,{params}:{params:Promise<{threadId:string}>}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 const input=schema.safeParse(await request.json().catch(()=>null));
 const id=z.string().uuid().safeParse((await params).threadId);
 if(!input.success||!id.success)return NextResponse.json({error:"INVALID_BODY"},{status:400});
 const context=await getCurrentRequestContext();
 if(!context.membership||!hasMembershipRole(context,"TPO"))
  return NextResponse.json({error:"FORBIDDEN"},{status:403});
 try{
  const message=await sendThreadMessage(context,id.data,input.data.body);
  return NextResponse.json({messageId:message.id},{status:201,headers:{"Cache-Control":"no-store"}});
 }catch(error){
  if(error instanceof TpoMessagingError)return NextResponse.json({error:"THREAD_NOT_FOUND"},{status:404});
  throw error;
 }
}
