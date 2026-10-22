import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {purgeExpiredFacultyIdentityEvidence}
 from "@/modules/people/faculty-identity-evidence-retention-service";
export const runtime="nodejs";
export async function POST(request:Request){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403,
   headers:{"Cache-Control":"private, no-store"}});
 try{
  const result=await purgeExpiredFacultyIdentityEvidence(
   await getCurrentRequestContext(),await request.json());
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
