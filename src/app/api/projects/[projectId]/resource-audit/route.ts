import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getProjectResourceAuditPage} from "@/modules/projects/workspace-view-service";
import {z} from "zod";

import { privateJson } from "@/security/responses";
import { zUuid } from "@/lib/schema-primitives";
export const runtime="nodejs";
const cursorSchema=z.object({
  beforeTime:z.iso.datetime().optional(),
  beforeId:zUuid.optional(),
}).strict().refine(value=>Boolean(value.beforeTime)===Boolean(value.beforeId));
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const {projectId}=params;
    const url=new URL(request.url);
    const parsed=cursorSchema.safeParse({
      beforeTime:url.searchParams.get("beforeTime")??undefined,
      beforeId:url.searchParams.get("beforeId")??undefined,
    });
    if(!parsed.success)return NextResponse.json({error:"INVALID_ACTIVITY_CURSOR"},{status:400});
    const cursor=parsed.data.beforeTime&&parsed.data.beforeId
      ?{beforeTime:parsed.data.beforeTime,beforeId:parsed.data.beforeId}:undefined;
    const page=await getProjectResourceAuditPage(__ctx,projectId,cursor);
    return privateJson(page);
  },
);
