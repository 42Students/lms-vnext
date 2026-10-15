import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {AuthorizationError} from "@/modules/permissions/policy";
import {createTpoInternalThread} from "@/modules/placements/tpo-team-internal-create-service";
import {internalThreadSchema} from "@/modules/placements/tpo-team-internal-model";
export const runtime="nodejs";
export async function POST(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 const form=await request.formData().catch(()=>null);
 const parsed=internalThreadSchema.safeParse({
  recipientMembershipId:form?.get("recipientMembershipId"),
  topic:form?.get("topic"),
 });
 if(!parsed.success)return NextResponse.json({error:"INVALID_BODY"},{status:400});
 try{
  const thread=await createTpoInternalThread(await getCurrentRequestContext(),parsed.data);
  return NextResponse.redirect(new URL("/tpo/team/"+thread.id,request.url),303);
 }catch(error){
  if(error instanceof AuthorizationError)return NextResponse.json({error:"FORBIDDEN"},{status:403});
  if(error instanceof z.ZodError)return NextResponse.json({error:"INVALID_BODY"},{status:400});
  if(error instanceof Error&&error.message==="TEAM_RECIPIENT_NOT_FOUND")
   return NextResponse.json({error:"RECIPIENT_NOT_FOUND"},{status:404});
  if(error instanceof Error&&error.message==="TEAM_TABLES_PENDING")
   return NextResponse.json({error:"TEAM_TABLES_PENDING"},{status:503});
  throw error;
 }
}
