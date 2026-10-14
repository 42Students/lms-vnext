import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {updateCollegeOfferingMetadata,CollegeOfferingMetadataError}
  from "@/modules/courses/college-offering-metadata-service";
export const runtime="nodejs";
export async function PATCH(request:Request,{params}:{params:Promise<{offeringId:string}>}){
  if(!isSameOriginRequest(request))
    return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
  try{
    const {offeringId}=await params;
    return NextResponse.json({offering:await updateCollegeOfferingMetadata(
      await getCurrentRequestContext(),offeringId,await request.json(),
    )});
  }catch(error){
    if(error instanceof CollegeOfferingMetadataError)
      return NextResponse.json({error:error.code},
        {status:error.code==="OFFERING_NOT_FOUND"?404:409});
    return apiErrorResponse(error);
  }
}
