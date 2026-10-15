import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { loadOwnFacultyProfileDocumentStaged } from "@/modules/people/faculty-profile-self.staged";
import { patchOwnFacultyProfileSection } from "@/modules/people/faculty-self-section-service";
import { readBoundedFacultyProfileJson,FacultyProfileBodyTooLarge } from "@/modules/people/faculty-profile-request-body";

export const runtime="nodejs";
export async function GET(){
 try{
  const context=await getCurrentRequestContext();
  return NextResponse.json(await loadOwnFacultyProfileDocumentStaged(context));
 }catch(error){return apiErrorResponse(error);}
}
export async function PATCH(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const context=await getCurrentRequestContext();
  let body:unknown;
  try{body=await readBoundedFacultyProfileJson(request);}catch(error){
   return NextResponse.json({error:error instanceof FacultyProfileBodyTooLarge?"REQUEST_TOO_LARGE":"INVALID_REQUEST"},
    {status:error instanceof FacultyProfileBodyTooLarge?413:400});
  }
  const result=await patchOwnFacultyProfileSection(context,body);
  return NextResponse.json(result);
 }catch(error){return apiErrorResponse(error);}
}
