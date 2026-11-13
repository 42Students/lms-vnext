import { boundedRequestJson } from "@/lib/request-body";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { confirmCollegeGroupCsv, confirmCollegeGroupManual } from "@/modules/groups/college-group-import-service";
import { GroupCsvPreviewNotFoundError } from "@/modules/groups/college-group-csv-preview-service";
import { route } from "@/security/route";

export const runtime = "nodejs";
async function handlePOST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const context = await getCurrentRequestContext();
    const raw: unknown = await boundedRequestJson(request, 8 * 1024 * 1024);
    const isManual = raw !== null && typeof raw === "object" &&
      !Array.isArray(raw) && "identifierType" in raw;
    return NextResponse.json(isManual
      ? await confirmCollegeGroupManual(context, raw)
      : await confirmCollegeGroupCsv(context, raw));
  } catch (error) {
    if (error instanceof GroupCsvPreviewNotFoundError)
      return NextResponse.json({ error: "GROUP_NOT_FOUND" }, { status: 404 });
    return apiErrorResponse(error);
  }
}
export const POST = route(
  { auth: "user", permission: "academics.manage", stepUp: true },
  ({ request }) => handlePOST(request as Parameters<typeof handlePOST>[0]),
);
