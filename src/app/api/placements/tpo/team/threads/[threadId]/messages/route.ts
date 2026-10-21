import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {AuthorizationError} from "@/modules/permissions/policy";
import {postTpoInternalMessage,TeamAddPeopleRequiredError} from "@/modules/placements/tpo-team-internal-reply-service";
import {internalMessageSchema} from "@/modules/placements/tpo-team-internal-model";
export const runtime="nodejs";
export async function POST(request:Request,{params}:{params:Promise<{threadId:string}>}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 const {threadId}=await params;
 const form=await request.formData().catch(()=>null);
 const parsed=internalMessageSchema.safeParse({threadId,body:form?.get("body"),
  idempotencyKey:form?.get("idempotencyKey")||undefined,
  markDecision:form?.get("markDecision")==="true",
  mentionMembershipIds:String(form?.get("mentionMembershipIds")??"").split(",").filter(Boolean),
  addMentionedMembers:form?.get("addMentionedMembers")==="true"});
 if(!parsed.success)return NextResponse.json({error:"INVALID_BODY"},{status:400});
 try{
  const result=await postTpoInternalMessage(await getCurrentRequestContext(),parsed.data);
  if(request.headers.get("accept")?.includes("application/json"))
   return NextResponse.json(result);
  return NextResponse.redirect(new URL("/tpo/team/"+threadId,request.url),303);
 }catch(error){
  if(error instanceof AuthorizationError)return NextResponse.json({error:"FORBIDDEN"},{status:403});
  if(error instanceof z.ZodError)return NextResponse.json({error:"INVALID_BODY"},{status:400});
  if(error instanceof Error&&error.message==="TEAM_THREAD_NOT_FOUND")
   return NextResponse.json({error:"NOT_FOUND"},{status:404});
  if(error instanceof TeamAddPeopleRequiredError)
   return NextResponse.json({
    error:"ADD_PEOPLE",message:"Add the mentioned people to this private topic and send?",
    people:error.people,
   },{status:409,headers:{"Cache-Control":"private, no-store"}});
  if(error instanceof Error&&["TEAM_MENTION_NOT_FOUND","TEAM_MENTION_NOT_ALLOWED"].includes(error.message))
   return NextResponse.json({error:error.message},{status:409});
  if(error instanceof Error&&error.message==="TEAM_PARTICIPANT_INACTIVE")
   return NextResponse.json({error:"TEAM_PARTICIPANT_INACTIVE"},{status:409});
  if(error instanceof Error&&error.message==="TEAM_IDEMPOTENCY_CONFLICT")
   return NextResponse.json({error:"STALE_MESSAGE"},{status:409});
  if(error instanceof Error&&error.message==="TEAM_TABLES_PENDING")
   return NextResponse.json({error:"TEAM_TABLES_PENDING"},{status:503});
  throw error;
 }
}
