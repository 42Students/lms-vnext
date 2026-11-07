import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  CollegeSectionError, createCollegeSection,
} from "@/modules/academics/college-section-mutation-service";

export const runtime = "nodejs";

export const POST = route(
  { auth: "user", permission: "academics.manage" },
  async ({ request, context: __actor }) => {
    const context = __actor!;
    try {
const body: unknown = await boundedRequestJson(request);
const section = await createCollegeSection(context, body);
return NextResponse.json({ section }, { status: 201 });
} catch (error) {
    if (error instanceof CollegeSectionError) {
      return NextResponse.json({ error: error.code }, {
        status: error.code === "CLASS_COHORT_NOT_FOUND" ? 404 : 409,
      });
    }
    return apiErrorResponse(error);
  }
  },
);
