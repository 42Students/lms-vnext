import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { requireLearnerPlacementAccess } from "@/modules/placements/learner-participation-guard";
import {patchCandidatePreferences} from "@/modules/placements/candidate-preferences-patch-service";
import {
  getCandidatePreferences,
  upsertCandidatePreferences,
} from "@/modules/placements/candidate-preferences-service";
import { secured } from "@/security/secure-handler";

export const runtime = "nodejs";

async function handleGET() {
  try {
    const context = await getCurrentRequestContext();
    await requireLearnerPlacementAccess(context);
    const preferences =
      await getCandidatePreferences(context);
    return NextResponse.json({ preferences });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
export const GET = secured(handleGET);

async function handlePUT(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }

  try {
    const context = await getCurrentRequestContext();
    await requireLearnerPlacementAccess(context);
    const body = await request.json();
    const preferences =
      await upsertCandidatePreferences(
        context,
        body,
      );
    return NextResponse.json({ preferences });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
export const PUT = secured(handlePUT);

/** Conflict-aware partial update, unlike the legacy full-form PUT. */
async function handlePATCH(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const context=await getCurrentRequestContext();
  const preferences=await patchCandidatePreferences(context,await request.json());
  return NextResponse.json({preferences},{headers:{"cache-control":"no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
export const PATCH = secured(handlePATCH, { csrf: "enforce" });
