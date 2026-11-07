import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {rollbackProjectTemplate} from "@/modules/projects/template-rollback-service";
export const runtime="nodejs";
const rollbackCommand=z.strictObject({
 versionId:z.string().uuid(),expectedTemplateVersion:z.number().int().min(1),
 confirmed:z.literal(true),
 expectedAssignedCollegeCount:z.number().int().min(0).optional(),
 expectedPinnedWorkspaceCount:z.number().int().min(0).optional(),
});
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const {templateId}=params;
    const raw:unknown=await boundedRequestJson(request).catch(()=>null);
    const command=rollbackCommand.safeParse(raw);
    if(!command.success)return NextResponse.json({
   error:"ROLLBACK_CONFIRMATION_REQUIRED",
   message:"Review this template version and confirm rollback with its current version.",
  },{status:400,headers:{"Cache-Control":"private, no-store"}});
    const result=await rollbackProjectTemplate(__ctx,templateId,command.data);
    return NextResponse.json({...result,message:"Template rolled back"},{headers:{"Cache-Control":"private, no-store"}});
  },
);
