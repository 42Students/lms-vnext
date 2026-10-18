import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {updateOwnRecruiterDesignation} from "@/modules/placements/recruiter-designation-service";
import {readRecruiterJsonBody,RecruiterJsonBodyError} from "@/modules/placements/recruiter-json-request";
export const runtime="nodejs";
export async function PATCH(request:Request) {
 if(!isSameOriginRequest(request)) return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try {
  const context=await getCurrentRequestContext();
  const input:unknown=await readRecruiterJsonBody(request);
  return NextResponse.json({profile:await updateOwnRecruiterDesignation(context,input)});
 } catch(error){if(error instanceof RecruiterJsonBodyError)
   return NextResponse.json({error:"INVALID_REQUEST"},{status:error.kind==="TOO_LARGE"?413:400});
   return apiErrorResponse(error);}
}
