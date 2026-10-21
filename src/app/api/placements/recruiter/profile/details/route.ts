import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {updateOwnRecruiterProfileDetails} from "@/modules/placements/recruiter-profile-details-service";
import {readRecruiterJsonBody,RecruiterJsonBodyError} from "@/modules/placements/recruiter-json-request";
export const runtime="nodejs";
export async function PATCH(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const raw:unknown=await readRecruiterJsonBody(request);
  if(raw===null)return NextResponse.json({error:"BODY_REQUIRED"},{status:400});
  const profile=await updateOwnRecruiterProfileDetails(await getCurrentRequestContext(),raw);
  return NextResponse.json({profile});
 }catch(error){if(error instanceof RecruiterJsonBodyError)
  return NextResponse.json({error:"INVALID_REQUEST"},{status:error.kind==="TOO_LARGE"?413:400});
  return apiErrorResponse(error);}
}
