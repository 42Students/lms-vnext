import { NextResponse } from "next/server";
import {z} from "zod";
import {readBoundedUtf8Body} from "@/lib/bounded-utf8-body";
import {MENTOR_SIGNOFF_MAX_BODY_BYTES} from
 "@/modules/projects/mentor-sprint-signoff-request-policy";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  completeProjectSprint,
} from "@/modules/projects/lifecycle-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    projectId: string;
    sprintId: string;
  }>;
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
    const { projectId, sprintId } = await params;
    const body=await readBoundedUtf8Body(request,MENTOR_SIGNOFF_MAX_BODY_BYTES);
    if(body.kind==="TOO_LARGE")
      return NextResponse.json({error:"UPDATE_TOO_LONG"},{status:413});
    if(body.kind!=="OK")
      return NextResponse.json({error:"INVALID_JSON"},{status:400});
    let input:unknown={};
    // Keep the legacy empty POST as a valid sign-off without task choices.
    if(body.body.trim()){
      try{input=JSON.parse(body.body) as unknown;}
      catch{return NextResponse.json({error:"INVALID_JSON"},{status:400});}
    }
    const parsed=z.object({
      note:z.string().trim().max(1000).optional(),
      nextSprintId:z.string().uuid().optional(),
      startNextSprint:z.boolean().optional(),
      decisions:z.array(z.strictObject({
        taskId:z.string().uuid(),
        destination:z.enum(["NEXT","BACKLOG","DROP"]),
        expectedUpdatedAt:z.iso.datetime({offset:true}),
      })).max(250).optional(),
    }).strict().safeParse(input);
    if(!parsed.success)return NextResponse.json({error:"INVALID_SIGNOFF_NOTE"},{status:400});
    const sprint = await completeProjectSprint(
      context,
      projectId,
      sprintId,
      parsed.data.note,
      parsed.data.decisions,
      parsed.data.nextSprintId,
      parsed.data.startNextSprint??false,
    );

    return NextResponse.json({ sprint });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
