import { boundedRequestJson } from "@/lib/bounded-request-json";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  getCompanyVisibilitySettings,
  saveCompanyVisibilitySettings,
} from "@/modules/placements/tpo-policy-service";
import { route } from "@/security/route";

import { featureReady } from "@/config/features";
export const runtime = "nodejs";

async function handleGET(request: Request) {
  if (!featureReady("tpoApi")) return NextResponse.json({error:"DB09_MIGRATIONS_PENDING"},{status:503});

  try {
    const context = await getCurrentRequestContext();
    const collegeId = new URL(request.url).searchParams.get("collegeId") ?? "";
    const visibility = await getCompanyVisibilitySettings(context, collegeId);
    return NextResponse.json({ visibility });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  ({ request }) => handleGET(request as Parameters<typeof handleGET>[0]),
);

async function handlePUT(request: Request) {
  if (!featureReady("tpoApi")) return NextResponse.json({error:"DB09_MIGRATIONS_PENDING"},{status:503});

  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }

  try {
    const context = await getCurrentRequestContext();
    const input = await boundedRequestJson(request);
    const result = await saveCompanyVisibilitySettings(context, input);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }
    return NextResponse.json({ visibility: result.visibility });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
export const PUT = route(
  { auth: "user", permission: "service-enforced" },
  ({ request }) => handlePUT(request as Parameters<typeof handlePUT>[0]),
);
