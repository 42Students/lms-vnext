import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { updateOwnPlacementNotificationPreferences } from "@/modules/placements/learner-placement-notification-service";
import { getCandidatePreferences } from "@/modules/placements/candidate-preferences-service";

export const runtime="nodejs";

/** Own notification facet only. Legacy JobPreferences role/city/shift fields
 * belong to the learner profile and cannot be reconstructed here. */
export const GET = route(
  { auth: "user", permission: "actor-owned" },
  async ({ context: actor }) => {
    const context = actor!;
    const {notifyMatchingJobs,notifyApplicationUpdates}=await getCandidatePreferences(context);
    return NextResponse.json({preferences:{notifyMatchingJobs,notifyApplicationUpdates},
      status:"success",message:"Success"});
  },
);


export const PUT = route(
  { auth: "user", permission: "actor-owned" },
  async ({ request, context: actor }) => {
    const context = actor!;
    const preferences=await updateOwnPlacementNotificationPreferences(context,await boundedRequestJson(request));
    return NextResponse.json({preferences,status:"success",message:"Updated successfully"});
  },
);
