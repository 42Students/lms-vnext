import { route } from "@/security/route";
import { NextResponse } from "next/server";
import {
  archiveProjectInstance,
} from "@/modules/projects/instance-service";
import {archiveProjectInstanceInputSchema} from "@/modules/projects/instance-archive-model";

export const runtime = "nodejs";

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { projectId } = params;
    const length=Number(request.headers.get("content-length")??"0");
    if(!Number.isFinite(length)||length>512)
      return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
    const body=await request.text();
    if(body.length>512)
      return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
    let input:unknown;
    try{input=JSON.parse(body);}catch{
      return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
    }
    const parsed=archiveProjectInstanceInputSchema.safeParse(input);
    if(!parsed.success)
      return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
    const project = await archiveProjectInstance(
      context,
      projectId,
      parsed.data,
    );
    return NextResponse.json({
      project,
      message: "Project archived",
      destructive:false,legacyOperation:"ARCHIVE",
      recovery: {
        action: "RESTORE",
        href: "/api/projects/" + encodeURIComponent(projectId) + "/restore",
        method: "POST",
      },
    });
  },
);
