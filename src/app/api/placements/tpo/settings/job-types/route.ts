import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {createTpoJobType,saveTpoJobTypes,TpoConfigError} from "@/modules/placements/tpo-job-type-write-service";
export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    const result=await createTpoJobType(__ctx,await request.json());
    return NextResponse.json(result,{status:201,headers:{"Cache-Control":"private, no-store"}});
  },
);

export const PUT = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    const result=await saveTpoJobTypes(__ctx,await request.json());
    return NextResponse.json({
    ...result,
    message:"Job types saved",
    contract:"ATOMIC_COLLEGE_LIST_REPLACEMENT",
    legacyEndpoint:"PUT /api/v1/tpo/settings/job-types",
    editorHref:"/tpo/settings?tab=job-types",
  },{headers:{"Cache-Control":"private, no-store"}});
  },
);
