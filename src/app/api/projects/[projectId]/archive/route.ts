import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  archiveProjectInstance,
} from "@/modules/projects/instance-service";
import {archiveProjectInstanceInputSchema} from "@/modules/projects/instance-archive-model";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

export async function POST(
  request: Request,
  { params }: RouteContext,
) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }

  try {
    const context = await getCurrentRequestContext();
    const { projectId } = await params;
    // A single optimistic timestamp is all this endpoint accepts.
    // Reject oversized/ambiguous requests before entering the write service.
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
    // Old LMS exposed a separate Delete; do not reinterpret this explicit
    // archive-confirmation path as permanent deletion. Client must present
    // Archive versus Delete as distinct choices, both with optimistic token.
    // Archiving is reversible; it is not the legacy destructive Delete.
    // Recovery stays discoverable even when the archived workspace is hidden.
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
  } catch (error) {
    return apiErrorResponse(error);
  }
}
