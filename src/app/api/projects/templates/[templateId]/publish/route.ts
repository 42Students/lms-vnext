import { route } from "@/security/route";
import { NextResponse } from "next/server";
import {
  publishProjectTemplate,
} from "@/modules/projects/template-service";

export const runtime = "nodejs";

export const POST = route(
  { auth: "user", permission: "project-template.manage" },
  async ({ context: actor, params }) => {
    const context = actor!;
    const { templateId } = params;
    const template = await publishProjectTemplate(
      context,
      templateId,
    );
    return NextResponse.json({ template });
  },
);
