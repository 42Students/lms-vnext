import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { getMentorMeetingChangeHistory } from "@/modules/projects/mentor-meeting-history-service";

export const runtime = "nodejs";
type Route = { params: Promise<{ projectId: string }> };

/** Typed, paginated meeting history for the currently assigned mentor only. */
export async function GET(request: Request, { params }: Route) {
  try {
    const { projectId } = await params;
    const url = new URL(request.url);
    const data = await getMentorMeetingChangeHistory(await getCurrentRequestContext(), {
      projectId,
      ...(url.searchParams.has("meetingKey") ? { meetingKey: url.searchParams.get("meetingKey") } : {}),
      page: url.searchParams.get("page") ?? "1",
    });
    return NextResponse.json(data, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return apiErrorResponse(error); }
}
