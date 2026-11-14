import { route } from "@/security/route";
import { z } from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { listStandaloneProjectLearnerCandidates } from "@/modules/projects/class-team-roster-service";

import { privateJson } from "@/security/responses";
import { zUuid } from "@/lib/schema-primitives";
export const runtime="nodejs";
export const GET = route(
  { auth: "user", permission: "projects.manage" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    const input=z.strictObject({
      collegeId:zUuid,q:z.string().max(120).optional(),
      page:z.coerce.number().int().min(0).max(100).optional(),
    }).parse(Object.fromEntries(new URL(request.url).searchParams));
    const result=await listStandaloneProjectLearnerCandidates(__ctx,
      input.collegeId,input.q??"",input.page??0);
    return privateJson(result);
  },
);
