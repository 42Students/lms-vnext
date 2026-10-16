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
    if (body.action === "PREVIEW")
      return NextResponse.json({ preview: await previewTpoAcademicImport(context, input) });
    return NextResponse.json({ result: await commitTpoAcademicImport(context, input) });
  } catch (error) { return apiErrorResponse(error); }
}
