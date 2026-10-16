import {NextResponse} from "next/server";
import {z} from "zod";
import {AuthorizationError} from "@/modules/permissions/policy";
import {getCurrentRequestContext} from "@/auth/request-context";
import {getRecruiterConversationPulse} from "@/modules/placements/recruiter-conversation-pulse-service";
export const runtime="nodejs";
export async function GET(request:Request){
 const url=new URL(request.url);
 const parsed=z.strictObject({collegeId:z.string().uuid(),threadId:z.string().uuid().optional()}).safeParse({
  collegeId:url.searchParams.get("collegeId"),
  threadId:url.searchParams.get("threadId")||undefined,
 });
 if(!parsed.success)return NextResponse.json({error:"INVALID_QUERY"},{status:400});
 try{
  const pulse=await getRecruiterConversationPulse(await getCurrentRequestContext(),parsed.data);
  return NextResponse.json(pulse,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  if(error instanceof AuthorizationError || (error instanceof Error && /^(RECRUITER_CONVERSATION_ACCESS_DENIED|RECRUITER_CONVERSATION_NOT_FOUND)$/.test(error.message)))
   return NextResponse.json({error:"NOT_FOUND"},{status:404});
  throw error;
 }
}
