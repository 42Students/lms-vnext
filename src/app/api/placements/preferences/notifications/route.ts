import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { updateOwnPlacementNotificationPreferences } from "@/modules/placements/learner-placement-notification-service";
import { getCandidatePreferences } from "@/modules/placements/candidate-preferences-service";
import { secured } from "@/security/secure-handler";

export const runtime="nodejs";

/** Own notification facet only. Legacy JobPreferences role/city/shift fields
 * belong to the learner profile and cannot be reconstructed here. */
async function handleGET() {
  try {
    const context=await getCurrentRequestContext();
    const {notifyMatchingJobs,notifyApplicationUpdates}=await getCandidatePreferences(context);
    return NextResponse.json({preferences:{notifyMatchingJobs,notifyApplicationUpdates},
      status:"success",message:"Success"});
  } catch(error) {
    return apiErrorResponse(error);
  }
}
export const GET = secured(handleGET);


async function handlePUT(request:Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
  }
  try {
    const context=await getCurrentRequestContext();
    const preferences=await updateOwnPlacementNotificationPreferences(context,await request.json());
    return NextResponse.json({preferences,status:"success",message:"Updated successfully"});
  } catch(error) {
    return apiErrorResponse(error);
  }
}
export const PUT = secured(handlePUT, { csrf: "enforce" });
