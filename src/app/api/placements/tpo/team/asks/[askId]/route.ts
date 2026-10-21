import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {AuthorizationError} from "@/modules/permissions/policy";
import {changeTpoTeamAskById} from "@/modules/placements/tpo-team-asks-service";

export const runtime="nodejs";
const actionSchema=z.strictObject({
 action:z.enum(["DONE","CANCEL"]),
 note:z.string().trim().max(2000).optional(),
});
export async function POST(request:Request,{params}:{
 params:Promise<{askId:string}>;
}){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 const {askId}=await params;
 if(!z.string().uuid().safeParse(askId).success)
  return NextResponse.json({error:"NOT_FOUND"},{status:404});
 const body:unknown=await request.json().catch(()=>null);
 const parsed=actionSchema.safeParse(body);
 if(!parsed.success)return NextResponse.json({error:"INVALID_BODY"},{status:400});
 try{
  const result=await changeTpoTeamAskById(await getCurrentRequestContext(),{
   askId,...parsed.data,
  });
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  if(error instanceof AuthorizationError)
   return NextResponse.json({error:"FORBIDDEN"},{status:403});
  const code=error instanceof Error?error.message:"";
  if(code==="TEAM_ASK_NOT_FOUND"||code==="TEAM_THREAD_NOT_FOUND")
   return NextResponse.json({error:"NOT_FOUND"},{status:404});
  if(code==="TEAM_ASK_STALE")return NextResponse.json({error:"STALE_MESSAGE"},{status:409});
  if(code==="TEAM_ASKS_PENDING")return NextResponse.json({error:"UNAVAILABLE"},{status:503});
  throw error;
 }
}
