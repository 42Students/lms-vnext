import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {
 issueOwnFacultyAttachmentUpload,completeOwnFacultyAttachmentUpload,
 openOwnFacultyAttachment,revokeOwnFacultyAttachment,
} from "@/modules/people/faculty-section-attachment-service";
import { secured } from "@/security/secure-handler";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const noStore={"Cache-Control":"private, no-store"};
async function handlePOST(request:Request){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403,headers:noStore});
 try{
  return NextResponse.json(await issueOwnFacultyAttachmentUpload(
   await getCurrentRequestContext(),await request.json()),{headers:noStore});
 }catch(error){return apiErrorResponse(error);}
}
export const POST = secured(handlePOST);
async function handlePATCH(request:Request){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403,headers:noStore});
 try{
  return NextResponse.json(await completeOwnFacultyAttachmentUpload(
   await getCurrentRequestContext(),await request.json()),{headers:noStore});
 }catch(error){return apiErrorResponse(error);}
}
export const PATCH = secured(handlePATCH);
async function handleGET(request:Request){
 try{
  const params=new URL(request.url).searchParams;
  return NextResponse.json(await openOwnFacultyAttachment(
   await getCurrentRequestContext(),{
    purpose:params.get("purpose"),entryId:params.get("entryId"),
    receiptId:params.get("receiptId"),
   }),{headers:noStore});
 }catch(error){return apiErrorResponse(error);}
}
export const GET = secured(handleGET);
async function handleDELETE(request:Request){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403,headers:noStore});
 try{
  return NextResponse.json(await revokeOwnFacultyAttachment(
   await getCurrentRequestContext(),await request.json()),{headers:noStore});
 }catch(error){return apiErrorResponse(error);}
}
export const DELETE = secured(handleDELETE);
