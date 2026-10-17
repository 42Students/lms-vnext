import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {AuthorizationError} from "@/modules/permissions/policy";
import {acknowledgeTpoInternalThread} from "@/modules/placements/tpo-team-internal-ack-service";
import {tpoThreadIdSchema} from "@/modules/placements/tpo-team-conversation-service";
export const runtime="nodejs";
export async function POST(request:Request,{params}:{params:Promise<{threadId:string}>}){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 const {threadId}=await params;
 const id=tpoThreadIdSchema.safeParse(threadId);
 if(!id.success)return NextResponse.json({error:"NOT_FOUND"},{status:404});
 try{
  const result=await acknowledgeTpoInternalThread(await getCurrentRequestContext(),id.data);
  if(request.headers.get("accept")?.includes("application/json"))return NextResponse.json(result);
  return NextResponse.redirect(new URL("/tpo/team/"+id.data,request.url),303);
 }catch(error){
  if(error instanceof AuthorizationError)
   return NextResponse.json({error:"FORBIDDEN"},{status:403});
  if(error instanceof z.ZodError)
   return NextResponse.json({error:"INVALID_ID"},{status:400});
  if(error instanceof Error&&error.message==="TEAM_THREAD_NOT_FOUND")
   return NextResponse.json({error:"NOT_FOUND"},{status:404});
  throw error;
 }
}
