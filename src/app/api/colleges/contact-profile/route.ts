import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  CollegeContactProfileError,
  updateOwnCollegeContactProfile,
} from "@/modules/colleges/college-contact-profile-service";

export const runtime = "nodejs";

export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const context = __actor!;
    try {
const raw: unknown = await request.json();
const saved = await updateOwnCollegeContactProfile(context, raw);
return NextResponse.json({ profile: saved });
} catch (error) {
    if (error instanceof CollegeContactProfileError) {
      return NextResponse.json({ error: error.code }, {
        status: error.code === "COLLEGE_NOT_FOUND" ? 404 : 409,
      });
    }
    return apiErrorResponse(error);
  }
  },
);
