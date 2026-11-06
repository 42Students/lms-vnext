import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {
 issueOwnFacultyIdentityUpload,completeOwnFacultyIdentityUpload,
 openOwnFacultyIdentityEvidence,revokeOwnFacultyIdentityEvidence,
} from "@/modules/people/faculty-identity-evidence-service";
import { secured } from "@/security/secure-handler";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const noStore={"Cache-Control":"private, no-store"};
async function handlePOST(request:Request){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403,headers:noStore});
 try{
  const result=await issueOwnFacultyIdentityUpload(await getCurrentRequestContext(),
   await request.json());
  return NextResponse.json(result,{headers:noStore});
 }catch(error){return apiErrorResponse(error);}
}
export const POST = secured(handlePOST);
async function handlePATCH(request:Request){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403,headers:noStore});
 try{
  const result=await completeOwnFacultyIdentityUpload(await getCurrentRequestContext(),
   await request.json());
  return NextResponse.json(result,{headers:noStore});
 }catch(error){return apiErrorResponse(error);}
}
export const PATCH = secured(handlePATCH);
async function handleGET(request:Request){
 try{
  const search=new URL(request.url).searchParams;
  const result=await openOwnFacultyIdentityEvidence(await getCurrentRequestContext(),{
   kind:search.get("kind"),receiptId:search.get("receiptId"),
  });
  return NextResponse.json(result,{headers:noStore});
 }catch(error){return apiErrorResponse(error);}
}
export const GET = secured(handleGET);
async function handleDELETE(request:Request){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403,headers:noStore});
 try{
  const result=await revokeOwnFacultyIdentityEvidence(await getCurrentRequestContext(),
   await request.json());
  return NextResponse.json(result,{headers:noStore});
 }catch(error){return apiErrorResponse(error);}
}
export const DELETE = secured(handleDELETE);
