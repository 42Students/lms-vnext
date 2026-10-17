import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {AuthorizationError} from "@/modules/permissions/policy";
import {createTpoTeamAsk} from "@/modules/placements/tpo-team-asks-service";
import {tpoTeamAskCreateSchema} from "@/modules/placements/tpo-team-asks-model";
export const runtime="nodejs";
export async function POST(request:Request,{params}:{params:Promise<{threadId:string}>}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 const {threadId}=await params;
 const raw:unknown=await request.json().catch(()=>null);
 const parsed=tpoTeamAskCreateSchema.safeParse({
  ...(raw&&typeof raw==="object"&&!Array.isArray(raw)?raw:{}),threadId,
 });
 if(!parsed.success)return NextResponse.json({error:"INVALID_BODY"},{status:400});
 try{return NextResponse.json(await createTpoTeamAsk(await getCurrentRequestContext(),parsed.data));}
 catch(error){
  if(error instanceof AuthorizationError)return NextResponse.json({error:"FORBIDDEN"},{status:403});
  if(error instanceof z.ZodError)return NextResponse.json({error:"INVALID_BODY"},{status:400});
  const code=error instanceof Error?error.message:"";
  if(code==="TEAM_THREAD_NOT_FOUND")return NextResponse.json({error:"NOT_FOUND"},{status:404});
  if(["TEAM_ASK_STALE","TEAM_ASK_BAD_DUE"].includes(code))
   return NextResponse.json({error:code},{status:409});
  if(code==="TEAM_ASK_BAD_ASSIGNEE")return NextResponse.json({error:code},{status:400});
  if(code==="TEAM_ASKS_PENDING")return NextResponse.json({error:"UNAVAILABLE"},{status:503});
  throw error;
 }
}
