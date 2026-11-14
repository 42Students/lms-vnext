import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { duplicateProjectTemplate } from "@/modules/projects/template-service";

export const runtime = "nodejs";

export const POST = route(
  { auth: "user", permission: "project-template.manage" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { templateId } = params;
    const raw = await request.text();
    const body = raw
      ? JSON.parse(raw)
      : {};
    const result =
      await duplicateProjectTemplate(
        context,
        templateId,
        body,
      );
    return NextResponse.json(
      result,
      { status: 201 },
    );
  },
);
