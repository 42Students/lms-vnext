import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {
 issueOwnFacultyAttachmentUpload,completeOwnFacultyAttachmentUpload,
 openOwnFacultyAttachment,revokeOwnFacultyAttachment,
} from "@/modules/people/faculty-section-attachment-service";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const noStore={"Cache-Control":"private, no-store"};
export async function POST(request:Request){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403,headers:noStore});
 try{
  return NextResponse.json(await issueOwnFacultyAttachmentUpload(
   await getCurrentRequestContext(),await request.json()),{headers:noStore});
 }catch(error){return apiErrorResponse(error);}
}
export async function PATCH(request:Request){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403,headers:noStore});
 try{
  return NextResponse.json(await completeOwnFacultyAttachmentUpload(
   await getCurrentRequestContext(),await request.json()),{headers:noStore});
 }catch(error){return apiErrorResponse(error);}
}
export async function GET(request:Request){
 try{
  const params=new URL(request.url).searchParams;
  return NextResponse.json(await openOwnFacultyAttachment(
   await getCurrentRequestContext(),{
    purpose:params.get("purpose"),entryId:params.get("entryId"),
    receiptId:params.get("receiptId"),
   }),{headers:noStore});
 }catch(error){return apiErrorResponse(error);}
}
export async function DELETE(request:Request){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403,headers:noStore});
 try{
  return NextResponse.json(await revokeOwnFacultyAttachment(
   await getCurrentRequestContext(),await request.json()),{headers:noStore});
 }catch(error){return apiErrorResponse(error);}
}
