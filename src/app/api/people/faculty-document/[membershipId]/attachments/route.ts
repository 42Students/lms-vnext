import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {readBoundedFacultyProfileJson,FacultyProfileBodyTooLarge}
 from "@/modules/people/faculty-profile-request-body";
import {
 issueFacultyAdminDocumentUpload,
 completeFacultyAdminDocumentUpload,
 revokeFacultyAdminDocumentAttachment,
 openFacultyDocumentForAdmin,
} from "@/modules/people/faculty-admin-document-service";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const noStore={"Cache-Control":"private, no-store"};
type Params={params:Promise<{membershipId:string}>};

async function readInput(request:Request){
 try{return {value:await readBoundedFacultyProfileJson(request)} as const;}
 catch(error){
  return {error:NextResponse.json({error:error instanceof FacultyProfileBodyTooLarge?
   "REQUEST_TOO_LARGE":"INVALID_REQUEST"},
   {status:error instanceof FacultyProfileBodyTooLarge?413:400,headers:noStore})} as const;
 }
}

/** Authorized staff get an upload grant only for an existing Faculty profile
 * and a specific saved qualification/identity row in their managed college. */
export async function POST(request:Request,{params}:Params){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403,headers:noStore});
 try{
  const input=await readInput(request);
  if("error" in input)return input.error;
  const {membershipId}=await params;
  return NextResponse.json(await issueFacultyAdminDocumentUpload(
   await getCurrentRequestContext(),membershipId,input.value),{headers:noStore});
 }catch(error){return apiErrorResponse(error);}
}
export async function PATCH(request:Request,{params}:Params){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403,headers:noStore});
 try{
  const input=await readInput(request);
  if("error" in input)return input.error;
  const {membershipId}=await params;
  return NextResponse.json(await completeFacultyAdminDocumentUpload(
   await getCurrentRequestContext(),membershipId,input.value),{headers:noStore});
 }catch(error){return apiErrorResponse(error);}
}
export async function DELETE(request:Request,{params}:Params){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403,headers:noStore});
 try{
  const input=await readInput(request);
  if("error" in input)return input.error;
  const {membershipId}=await params;
  return NextResponse.json(await revokeFacultyAdminDocumentAttachment(
   await getCurrentRequestContext(),membershipId,input.value),{headers:noStore});
 }catch(error){return apiErrorResponse(error);}
}
/** Read grants can never be issued from an object key; the current profile
 * must still reference a CLEAN, non-revoked receipt owned by that member. */
export async function GET(request:Request,{params}:Params){
 try{
  const {membershipId}=await params;
  const query=new URL(request.url).searchParams;
  return NextResponse.json(await openFacultyDocumentForAdmin(
   await getCurrentRequestContext(),membershipId,{
    receiptId:query.get("receiptId"),purpose:query.get("purpose"),
    ...(query.has("entryId")?{entryId:query.get("entryId")}:{}),
   }),{headers:noStore});
 }catch(error){return apiErrorResponse(error);}
}
