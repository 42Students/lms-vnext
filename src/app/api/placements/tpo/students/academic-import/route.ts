import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  commitTpoAcademicImport, previewTpoAcademicImport,previewTpoLegacyAcademicImport,
} from "@/modules/placements/tpo-academic-import-service";

export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!isSameOriginRequest(request))
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  try {
    const context = await getCurrentRequestContext();
    const body = z.object({
      action: z.enum(["PREVIEW", "IMPORT", "LEGACY_PREVIEW"]),
      rows: z.array(z.unknown()).min(1).max(5000),
      skipUnmatched: z.boolean().optional(),
    }).parse(await request.json());
    const input = { rows: body.rows, skipUnmatched: body.skipUnmatched ?? false };
    if(body.action==="LEGACY_PREVIEW")
      return NextResponse.json({
        preview:await previewTpoLegacyAcademicImport(context,body.rows),
        identifierType:"SCOPED_ROLL_OR_MEMBERSHIP_UUID",
      },{headers:{"Cache-Control":"private, no-store"}});
    // The verified evidence writer is intentionally limited to 200 rows
    // per transaction; the 5000-row legacy staging preview is not a blanket
    // authorization to commit unsupported sparse values or huge batches.
    if(body.rows.length>200)
      return NextResponse.json({error:"ACADEMIC_IMPORT_BATCH_TOO_LARGE",
        message:"Select up to 200 verified rows per import."},{status:400});
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
