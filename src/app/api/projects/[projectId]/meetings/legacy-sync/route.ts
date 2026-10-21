import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  readLegacyProjectMeetingSection, synchronizeLegacyProjectMeetingSection,
} from "@/modules/projects/legacy-meeting-section-sync-service";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{projectId: string}> };

export async function GET(_request: Request, {params}: RouteContext) {
  try {
    const context = await getCurrentRequestContext();
    const {projectId} = await params;
    const snapshot = await readLegacyProjectMeetingSection(context, projectId);
    return NextResponse.json(snapshot, {headers: {"Cache-Control": "private, no-store"}});
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PUT(request: Request, {params}: RouteContext) {
  if (!isSameOriginRequest(request))
    return NextResponse.json({error: "INVALID_ORIGIN"}, {status: 403});
  try {
    const context = await getCurrentRequestContext();
    const {projectId} = await params;
    const body: unknown = await request.json();
    const result = await synchronizeLegacyProjectMeetingSection(context, projectId, body);
    return NextResponse.json(result, {headers: {"Cache-Control": "private, no-store"}});
  } catch (error) {
    return apiErrorResponse(error);
  }
}
