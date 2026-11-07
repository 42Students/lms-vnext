import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { listStandaloneProjectLearnerCandidates } from "@/modules/projects/class-team-roster-service";

export const runtime="nodejs";
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    const input=z.strictObject({
      collegeId:z.string().uuid(),q:z.string().max(120).optional(),
      page:z.coerce.number().int().min(0).max(100).optional(),
    }).parse(Object.fromEntries(new URL(request.url).searchParams));
    const result=await listStandaloneProjectLearnerCandidates(__ctx,
      input.collegeId,input.q??"",input.page??0);
    return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
  },
);
