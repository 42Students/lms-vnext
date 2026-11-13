import { boundedRequestJson } from "@/lib/request-body";
import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {updateCollegeOfferingMetadata,CollegeOfferingMetadataError}
  from "@/modules/courses/college-offering-metadata-service";
export const runtime="nodejs";
export const PATCH = route(
  { auth: "user", permission: "courses.manage" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    try {
const {offeringId}=params;
return NextResponse.json({offering:await updateCollegeOfferingMetadata(
      __ctx,offeringId,await boundedRequestJson(request),
    )});
} catch(error){
    if(error instanceof CollegeOfferingMetadataError)
      return NextResponse.json({error:error.code},
        {status:error.code==="OFFERING_NOT_FOUND"?404:409});
    return apiErrorResponse(error);
  }
  },
);
