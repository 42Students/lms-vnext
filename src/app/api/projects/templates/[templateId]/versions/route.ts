import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { getSuperAdminTemplateVersionHistory } from "@/modules/projects/template-version-history-service";
import { templateVersionHistoryQuerySchema } from "@/modules/projects/template-version-history-model";

export const runtime = "nodejs";
type Route = { params: Promise<{ templateId: string }> };

/** Replaces legacy /api/v1/admin/project-templates/{id}/versions/page.
 * Uses immutable UUID template IDs and cookie-backed Super Admin auth.
 */
export const GET = route(
  { auth: "user", permission: "project-template.read" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const {templateId} = params;
    const url = new URL(request.url);
    const parsed = templateVersionHistoryQuerySchema.parse({
      page: url.searchParams.get("page") ?? "1",
    });
    const result = await getSuperAdminTemplateVersionHistory(
      __ctx, templateId, parsed);
    return NextResponse.json(result, {
      headers: {"Cache-Control":"private, no-store"},
    });
  },
);
