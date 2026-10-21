import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  commitTpoAcademicImport, previewTpoAcademicImport,
} from "@/modules/placements/tpo-academic-import-service";

export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!isSameOriginRequest(request))
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  try {
    const context = await getCurrentRequestContext();
    const body = z.object({
      action: z.enum(["PREVIEW", "IMPORT"]),
      rows: z.array(z.unknown()).min(1).max(200),
      skipUnmatched: z.boolean().optional(),
    }).parse(await request.json());
    const input = { rows: body.rows, skipUnmatched: body.skipUnmatched ?? false };
    // studentCode is the college-scoped learner membership UUID, NOT an
    // integer legacy learner or platform-user ID. Resolve historical IDs
    // offline through an approved college+learner crosswalk before this API.
    if (body.action === "PREVIEW")
      return NextResponse.json({
        preview:await previewTpoAcademicImport(context,input),
        identifierType:"COLLEGE_LEARNER_MEMBERSHIP_UUID",
      },{headers:{"Cache-Control":"private, no-store"}});
    return NextResponse.json({
      result:await commitTpoAcademicImport(context,input),
      identifierType:"COLLEGE_LEARNER_MEMBERSHIP_UUID",
    },{headers:{"Cache-Control":"private, no-store"}});
  } catch (error) { return apiErrorResponse(error); }
}
