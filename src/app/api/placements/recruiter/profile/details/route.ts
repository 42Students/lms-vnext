import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {updateOwnRecruiterProfileDetails} from "@/modules/placements/recruiter-profile-details-service";
export const runtime="nodejs";
export async function PATCH(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const raw:unknown=await request.json();
  const profile=await updateOwnRecruiterProfileDetails(await getCurrentRequestContext(),raw);
  return NextResponse.json({profile});
 }catch(error){return apiErrorResponse(error);}
}
