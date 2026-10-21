import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { updateOwnPlacementNotificationPreferences } from "@/modules/placements/learner-placement-notification-service";
import { getCandidatePreferences } from "@/modules/placements/candidate-preferences-service";

export const runtime="nodejs";

/** Own notification facet only. Legacy JobPreferences role/city/shift fields
 * belong to the learner profile and cannot be reconstructed here. */
export async function GET() {
  try {
    const context=await getCurrentRequestContext();
    const {notifyMatchingJobs,notifyApplicationUpdates}=await getCandidatePreferences(context);
    return NextResponse.json({preferences:{notifyMatchingJobs,notifyApplicationUpdates},
      status:"success",message:"Success"});
  } catch(error) {
    return apiErrorResponse(error);
  }
}


export async function PUT(request:Request) {
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
