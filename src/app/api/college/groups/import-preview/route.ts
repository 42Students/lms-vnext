import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  GroupCsvPreviewNotFoundError, previewCollegeGroupCsv,
} from "@/modules/groups/college-group-csv-preview-service";
import { route } from "@/security/route";
export const runtime = "nodejs";
async function handlePOST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const context = await getCurrentRequestContext();
    const raw: unknown = await request.json();
    const preview = await previewCollegeGroupCsv(context, raw);
    return NextResponse.json(preview);
  } catch (error) {
    if (error instanceof GroupCsvPreviewNotFoundError) {
      return NextResponse.json({ error: "GROUP_NOT_FOUND" }, { status: 404 });
    }
    return apiErrorResponse(error);
  }
}
export const POST = route(
  { auth: "user", permission: "service-enforced", stepUp: true },
  ({ request }) => handlePOST(request as Parameters<typeof handlePOST>[0]),
);
