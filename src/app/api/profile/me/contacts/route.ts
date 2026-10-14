import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { updateOwnLearnerContacts } from "@/modules/people/learner-contact-service";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const context = await getCurrentRequestContext();
    const result = await updateOwnLearnerContacts(context, await request.json());
    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
