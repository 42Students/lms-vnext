import { NextResponse } from "next/server";
import {z} from "zod";
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
    const raw=await request.text();
    if(raw.length>4096)return NextResponse.json({error:"UPDATE_TOO_LONG"},{status:413});
    let input:unknown={};
    if(raw.trim()){
      try{input=JSON.parse(raw) as unknown;}
      catch{return NextResponse.json({error:"INVALID_JSON"},{status:400});}
    }
    const parsed=z.object({note:z.string().trim().max(1000).optional()}).strict().safeParse(input);
    if(!parsed.success)return NextResponse.json({error:"INVALID_SIGNOFF_NOTE"},{status:400});
    const sprint = await completeProjectSprint(
      context,
      projectId,
      sprintId,
      parsed.data.note,
    );

    return NextResponse.json({ sprint });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
