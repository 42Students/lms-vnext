import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {AuthorizationError} from "@/modules/permissions/policy";
import {changeTpoTeamMessage,tpoTeamMessageChangeSchema} from "@/modules/placements/tpo-team-message-change-service";
export const runtime="nodejs";
export async function POST(request:Request,{params}:{params:Promise<{threadId:string;messageId:string}>}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 const {threadId,messageId}=await params;
 const raw:unknown=await request.json().catch(()=>null);
 const parsed=tpoTeamMessageChangeSchema.safeParse({
  ...(raw&&typeof raw==="object"&&!Array.isArray(raw)?raw:{}),
  threadId,messageId,
 });
 if(!parsed.success)return NextResponse.json({error:"INVALID_BODY"},{status:400});
 try{
  const result=await changeTpoTeamMessage(await getCurrentRequestContext(),parsed.data);
  return NextResponse.json(result);
 }catch(error){
  if(error instanceof AuthorizationError)return NextResponse.json({error:"FORBIDDEN"},{status:403});
  if(error instanceof z.ZodError)return NextResponse.json({error:"INVALID_BODY"},{status:400});
  const code=error instanceof Error?error.message:"";
  if(["TEAM_THREAD_NOT_FOUND","TEAM_MESSAGE_NOT_FOUND"].includes(code))
   return NextResponse.json({error:"NOT_FOUND"},{status:404});
  if(["TEAM_STALE_MESSAGE","TEAM_MESSAGE_REMOVED"].includes(code))
   return NextResponse.json({error:"STALE_MESSAGE"},{status:409});
  if(code==="TEAM_EDIT_WINDOW_EXPIRED")
   return NextResponse.json({error:"EDIT_WINDOW_EXPIRED"},{status:409});
  if(code==="TEAM_TABLES_PENDING")
   return NextResponse.json({error:"UNAVAILABLE"},{status:503});
  throw error;
 }
}
