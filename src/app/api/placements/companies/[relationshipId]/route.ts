import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  archivePlacementCompanyRelationship,
  updatePlacementCompanyRelationship,
} from "@/modules/placements/company-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ relationshipId: string }>;
};

export async function PATCH(
  request: Request,
  { params }: RouteContext,
) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }

  try {
    const context = await getCurrentRequestContext();
    const { relationshipId } = await params;
    const body = await request.json();
    const result =
      await updatePlacementCompanyRelationship(
        context,
        relationshipId,
        body,
      );
    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: RouteContext,
) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }

  try {
    const context = await getCurrentRequestContext();
    const { relationshipId } = await params;
    const result =
      await archivePlacementCompanyRelationship(
        context,
        relationshipId,
      );
    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
