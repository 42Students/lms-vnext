import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { bulkReassignProjectMentor } from "@/modules/projects/member-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }

  try {
    const context =
      await getCurrentRequestContext();
    const input: unknown = await request.json();
    // Old numeric mentorId is not a persisted membership UUID. Importers must
    // resolve it against the selected college before invoking this route.
    if(input && typeof input==="object" && !Array.isArray(input) &&
       "mentorId" in input && !("mentorMembershipId" in input))
      return NextResponse.json({error:"MENTOR_MEMBERSHIP_ID_REQUIRED"},{status:400});
    const result =
      await bulkReassignProjectMentor(
        context,
        input,
      );
    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
