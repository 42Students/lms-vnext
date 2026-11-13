import { boundedRequestJson } from "@/lib/bounded-request-json";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  getCollegePlacementRules,
  saveCollegePlacementRules,
} from "@/modules/placements/tpo-policy-service";
import { route } from "@/security/route";

import { featureReady } from "@/config/features";
export const runtime = "nodejs";

function migrationPendingResponse(){
  return NextResponse.json({
    error:"DB09_MIGRATIONS_PENDING",
    state:"UNAVAILABLE",
    eligibility:null,
    retryable:true,
    message:"Placement rules are temporarily unavailable. This does not mean a learner is ineligible; retry after the placement database is ready.",
  },{status:503,headers:{"Cache-Control":"private, no-store","Retry-After":"60"}});
}

async function handleGET(request: Request) {
  if (!featureReady("tpoApi")) return migrationPendingResponse();

  try {
    const context = await getCurrentRequestContext();
    const collegeId = new URL(request.url).searchParams.get("collegeId") ?? "";
    const rules = await getCollegePlacementRules(context, collegeId);
    return NextResponse.json({ rules });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  ({ request }) => handleGET(request as Parameters<typeof handleGET>[0]),
);

async function handlePUT(request: Request) {
  if (!featureReady("tpoApi")) return migrationPendingResponse();

  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }

  try {
    const context = await getCurrentRequestContext();
    const input = await boundedRequestJson(request);
    const result = await saveCollegePlacementRules(context, input);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }
    return NextResponse.json({ rules: result.rules });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
export const PUT = route(
  { auth: "user", permission: "service-enforced" },
  ({ request }) => handlePUT(request as Parameters<typeof handlePUT>[0]),
);
