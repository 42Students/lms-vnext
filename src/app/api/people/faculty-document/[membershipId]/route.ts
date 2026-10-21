import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {readBoundedFacultyProfileJson,FacultyProfileBodyTooLarge} from "@/modules/people/faculty-profile-request-body";
import {getFacultyDocumentForAdmin,patchFacultyDocumentForAdmin} from "@/modules/people/faculty-admin-document-service";

export const runtime="nodejs";
type Params={params:Promise<{membershipId:string}>};
export async function GET(_request:Request,{params}:Params){
 try{
  const {membershipId}=await params;
  return NextResponse.json(await getFacultyDocumentForAdmin(await getCurrentRequestContext(),membershipId),
   {headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
export async function PATCH(request:Request,{params}:Params){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {membershipId}=await params;
  let body:unknown;
  try{body=await readBoundedFacultyProfileJson(request);}
  catch(error){return NextResponse.json({error:error instanceof FacultyProfileBodyTooLarge?
   "REQUEST_TOO_LARGE":"INVALID_REQUEST"},{status:error instanceof FacultyProfileBodyTooLarge?413:400});}
  const value=await patchFacultyDocumentForAdmin(await getCurrentRequestContext(),membershipId,body);
  return NextResponse.json(value,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
export const PUT=PATCH;
