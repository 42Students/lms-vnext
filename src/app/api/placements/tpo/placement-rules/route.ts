import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  getCollegePlacementRules,
  saveCollegePlacementRules,
} from "@/modules/placements/tpo-policy-service";

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

export async function GET(request: Request) {
  if (process.env.DB09_TPO_API_READY !== "DB09_VERIFIED") return migrationPendingResponse();

  try {
    const context = await getCurrentRequestContext();
    const collegeId = new URL(request.url).searchParams.get("collegeId") ?? "";
    const rules = await getCollegePlacementRules(context, collegeId);
    return NextResponse.json({ rules });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PUT(request: Request) {
  if (process.env.DB09_TPO_API_READY !== "DB09_VERIFIED") return migrationPendingResponse();

  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }

  try {
    const context = await getCurrentRequestContext();
    const input = await request.json();
    const result = await saveCollegePlacementRules(context, input);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }
    return NextResponse.json({ rules: result.rules });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
