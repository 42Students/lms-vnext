import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { getPersonMembershipDetailWithRuntime } from "@/modules/people/runtime";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    membershipId: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const context = await getCurrentRequestContext();
    const { membershipId } = await params;
    const person = await getPersonMembershipDetailWithRuntime(
      context,
      membershipId,
    );

    return NextResponse.json({ person });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
