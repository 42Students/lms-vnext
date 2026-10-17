import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {AuthorizationError} from "@/modules/permissions/policy";
import {renameTpoTeamThread,tpoTeamRenameSchema} from "@/modules/placements/tpo-team-rename-service";
export const runtime="nodejs";
export async function POST(request:Request,{params}:{params:Promise<{threadId:string}>}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 const {threadId}=await params;
 const json:unknown=await request.json().catch(()=>null);
 const parsed=tpoTeamRenameSchema.safeParse({
  ...(json&&typeof json==="object"&&!Array.isArray(json)?json:{}),
  threadId,
 });
 if(!parsed.success)return NextResponse.json({error:"INVALID_BODY"},{status:400});
 try{
  const result=await renameTpoTeamThread(await getCurrentRequestContext(),parsed.data);
  return NextResponse.json(result);
 }catch(error){
  if(error instanceof AuthorizationError)return NextResponse.json({error:"FORBIDDEN"},{status:403});
  if(error instanceof z.ZodError)return NextResponse.json({error:"INVALID_BODY"},{status:400});
  if(error instanceof Error&&error.message==="TEAM_THREAD_NOT_FOUND")
   return NextResponse.json({error:"NOT_FOUND"},{status:404});
  if(error instanceof Error&&error.message==="TEAM_STALE_TOPIC")
   return NextResponse.json({error:"STALE_MESSAGE"},{status:409});
  if(error instanceof Error&&error.message==="TEAM_TABLES_PENDING")
   return NextResponse.json({error:"UNAVAILABLE"},{status:503});
  throw error;
 }
}
