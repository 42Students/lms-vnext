import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {
 issueOwnFacultyIdentityUpload,completeOwnFacultyIdentityUpload,
 openOwnFacultyIdentityEvidence,revokeOwnFacultyIdentityEvidence,
} from "@/modules/people/faculty-identity-evidence-service";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const noStore={"Cache-Control":"private, no-store"};
export async function POST(request:Request){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403,headers:noStore});
 try{
  const result=await issueOwnFacultyIdentityUpload(await getCurrentRequestContext(),
   await request.json());
  return NextResponse.json(result,{headers:noStore});
 }catch(error){return apiErrorResponse(error);}
}
export async function PATCH(request:Request){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403,headers:noStore});
 try{
  const result=await completeOwnFacultyIdentityUpload(await getCurrentRequestContext(),
   await request.json());
  return NextResponse.json(result,{headers:noStore});
 }catch(error){return apiErrorResponse(error);}
}
export async function GET(request:Request){
 try{
  const search=new URL(request.url).searchParams;
  const result=await openOwnFacultyIdentityEvidence(await getCurrentRequestContext(),{
   kind:search.get("kind"),receiptId:search.get("receiptId"),
  });
  return NextResponse.json(result,{headers:noStore});
 }catch(error){return apiErrorResponse(error);}
}
export async function DELETE(request:Request){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403,headers:noStore});
 try{
  const result=await revokeOwnFacultyIdentityEvidence(await getCurrentRequestContext(),
   await request.json());
  return NextResponse.json(result,{headers:noStore});
 }catch(error){return apiErrorResponse(error);}
}
