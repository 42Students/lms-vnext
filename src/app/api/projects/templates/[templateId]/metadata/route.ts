import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { editSuperAdminTemplateMetadata } from "@/modules/projects/template-metadata-edit-service";
export const runtime = "nodejs";
export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { templateId } = params;
    return NextResponse.json(await editSuperAdminTemplateMetadata(context, templateId, await boundedRequestJson(request)));
  },
);
