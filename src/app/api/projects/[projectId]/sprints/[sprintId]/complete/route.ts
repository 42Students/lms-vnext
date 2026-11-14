import { route } from "@/security/route";
import { NextResponse } from "next/server";
import {z} from "zod";
import {readBoundedUtf8Body} from "@/lib/request-body";
import {MENTOR_SIGNOFF_MAX_BODY_BYTES} from
 "@/modules/projects/mentor-sprint-signoff-request-policy";
import {
  completeProjectSprint,
} from "@/modules/projects/lifecycle-service";

import { zUuid } from "@/lib/schema-primitives";
export const runtime = "nodejs";

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { projectId, sprintId } = params;
    const body=await readBoundedUtf8Body(request,MENTOR_SIGNOFF_MAX_BODY_BYTES);
    if(body.kind==="TOO_LARGE")
      return NextResponse.json({error:"UPDATE_TOO_LONG"},{status:413});
    if(body.kind!=="OK")
      return NextResponse.json({error:"INVALID_JSON"},{status:400});
    let input:unknown={};
    if(body.body.trim()){
      try{input=JSON.parse(body.body) as unknown;}
      catch{return NextResponse.json({error:"INVALID_JSON"},{status:400});}
    }
    const parsed=z.object({
      note:z.string().trim().max(1000).optional(),
      nextSprintId:zUuid.optional(),
      startNextSprint:z.boolean().optional(),
      decisions:z.array(z.strictObject({
        taskId:zUuid,
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
  },
);
