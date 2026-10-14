import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { editSuperAdminTemplateMetadata } from "@/modules/projects/template-metadata-edit-service";
export const runtime = "nodejs";
export async function PATCH(request: Request, { params }: { params: Promise<{ templateId: string }> }) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  try {
    const context = await getCurrentRequestContext();
    const { templateId } = await params;
    return NextResponse.json(await editSuperAdminTemplateMetadata(context, templateId, await request.json()));
  } catch (error) { return apiErrorResponse(error); }
}
