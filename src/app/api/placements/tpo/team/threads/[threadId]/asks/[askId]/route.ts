import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {AuthorizationError} from "@/modules/permissions/policy";
import {changeTpoTeamAsk} from "@/modules/placements/tpo-team-asks-service";
import {tpoTeamAskActionSchema} from "@/modules/placements/tpo-team-asks-model";
export const runtime="nodejs";
export async function POST(request:Request,{params}:{params:Promise<{threadId:string;askId:string}>}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 const {threadId,askId}=await params;
 const raw:unknown=await request.json().catch(()=>null);
 const parsed=tpoTeamAskActionSchema.safeParse({
  ...(raw&&typeof raw==="object"&&!Array.isArray(raw)?raw:{}),threadId,askId,
 });
 if(!parsed.success)return NextResponse.json({error:"INVALID_BODY"},{status:400});
 try{return NextResponse.json(await changeTpoTeamAsk(await getCurrentRequestContext(),parsed.data));}
 catch(error){
  if(error instanceof AuthorizationError)return NextResponse.json({error:"FORBIDDEN"},{status:403});
  if(error instanceof z.ZodError)return NextResponse.json({error:"INVALID_BODY"},{status:400});
  const code=error instanceof Error?error.message:"";
  if(["TEAM_THREAD_NOT_FOUND","TEAM_ASK_NOT_FOUND"].includes(code))
   return NextResponse.json({error:"NOT_FOUND"},{status:404});
  if(code==="TEAM_ASK_STALE")return NextResponse.json({error:"STALE_MESSAGE"},{status:409});
  if(code==="TEAM_ASKS_PENDING")return NextResponse.json({error:"UNAVAILABLE"},{status:503});
  throw error;
 }
}
