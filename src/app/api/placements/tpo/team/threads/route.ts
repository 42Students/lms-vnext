import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {AuthorizationError} from "@/modules/permissions/policy";
import {createTpoInternalThread} from "@/modules/placements/tpo-team-internal-create-service";
import {internalThreadSchema} from "@/modules/placements/tpo-team-internal-model";
import {TpoTeamAddPeopleRequiredError} from "@/modules/placements/tpo-team-asks-service";
export const runtime="nodejs";
export async function POST(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 const isJson=request.headers.get("content-type")?.toLowerCase().includes("application/json")??false;
 let source:Record<string,unknown>={};
 if(isJson){
  const raw=await request.text().catch(()=>"");
  if(raw.length>16_000)return NextResponse.json({
    error:"INVALID_BODY",message:"Team conversation request is too large.",
  },{status:413});
  try{
   const json:unknown=JSON.parse(raw);
   if(json&&typeof json==="object"&&!Array.isArray(json))source=json as Record<string,unknown>;
  }catch{/* Handled as invalid body below. */}
 }else{
  const form=await request.formData().catch(()=>null);
  if(form){
   source={
    recipientMembershipId:form.get("recipientMembershipId"),
    topic:form.get("topic"),firstMessage:form.get("firstMessage")||undefined,
    kind:form.get("kind")||undefined,contextId:form.get("contextId")||undefined,
    participantMembershipIds:form.getAll("participantMembershipIds").map(String),
    idempotencyKey:form.get("idempotencyKey")||undefined,
   };
  }
 }
 const parsed=internalThreadSchema.safeParse({
  recipientMembershipId:source["recipientMembershipId"],
  topic:source["topic"],firstMessage:source["firstMessage"]??source["message"]??undefined,
  ...(source["kind"]?{kind:source["kind"]}:{}),
  ...(source["contextId"]?{contextId:source["contextId"]}:{}),
  ...(Array.isArray(source["participantMembershipIds"])?
    {participantMembershipIds:source["participantMembershipIds"]}:{}),
  ...(source["idempotencyKey"]?{idempotencyKey:source["idempotencyKey"]}:{}),
 });
 if(!parsed.success)return NextResponse.json({
  error:"INVALID_BODY",message:"Review the recipient, topic and first message.",
  field:String(parsed.error.issues[0]?.path[0]??"thread"),
 },{status:400,headers:{"Cache-Control":"private, no-store"}});
 try{
  const thread=await createTpoInternalThread(await getCurrentRequestContext(),parsed.data);
  if(isJson||request.headers.get("accept")?.includes("application/json"))
   return NextResponse.json({id:thread.id,thread,
     href:"/tpo/team/"+thread.id,message:"Team conversation started",
     navigation:{list:"/tpo/team",thread:"/tpo/team/"+thread.id,
      about:"/tpo/team/"+thread.id+"?tab=about",
      messages:"/api/placements/tpo/team/threads/"+thread.id+"/messages"},
   },{status:201,headers:{"Cache-Control":"private, no-store"}});
  return NextResponse.redirect(new URL("/tpo/team/"+thread.id,request.url),303);
 }catch(error){
  // ADD_PEOPLE is only safe when the scoped team-ask service has verified
  // each missing membership; never echo caller-supplied IDs as eligible people.
  if(error instanceof TpoTeamAddPeopleRequiredError)
   return NextResponse.json({
    error:"ADD_PEOPLE",
    missingMembershipIds:error.missingMembershipIds,
    message:"Add these people to the private conversation, then retry.",
    nextAction:"ADD_PEOPLE",
   },{status:409,headers:{"Cache-Control":"private, no-store"}});
  if(error instanceof AuthorizationError)return NextResponse.json({
   error:"FORBIDDEN",message:"You cannot create this team conversation.",
  },{status:403,headers:{"Cache-Control":"private, no-store"}});
  if(error instanceof z.ZodError)return NextResponse.json({error:"INVALID_BODY"},{status:400});
  if(error instanceof Error&&error.message==="TEAM_RECIPIENT_NOT_FOUND")
   return NextResponse.json({
    error:"RECIPIENT_NOT_FOUND",message:"Choose an active member of your college placement team.",
   },{status:404,headers:{"Cache-Control":"private, no-store"}});
  if(error instanceof Error&&error.message==="TEAM_IDEMPOTENCY_CONFLICT")
   return NextResponse.json({
    error:"STALE_MESSAGE",message:"This conversation has changed. Review and try again.",
   },{status:409,headers:{"Cache-Control":"private, no-store"}});
  if(error instanceof Error&&error.message==="TEAM_TABLES_PENDING")
   return NextResponse.json({
    error:"TEAM_TABLES_PENDING",message:"Team conversations are temporarily unavailable. Try again later.",
   },{status:503,headers:{"Cache-Control":"private, no-store","Retry-After":"60"}});
  throw error;
 }
}
