import { route } from "@/security/route";
import { z } from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { listProjectTeamClasses } from "@/modules/projects/class-team-roster-service";

import { noStoreJson } from "@/security/responses";
import { zUuid } from "@/lib/schema-primitives";
export const runtime = "nodejs";
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor }) => {
    const context = actor!;
    const url = new URL(request.url);
    const { collegeId, q, limit,offset } = z.object({
      collegeId:zUuid,q:z.string().max(120).optional(),
      limit:z.coerce.number().int().min(1).max(100).optional(),
      offset:z.coerce.number().int().min(0).max(99900).optional(),
    }).strict().parse(Object.fromEntries(url.searchParams));
    const classes = await listProjectTeamClasses(context,collegeId,{...(q!==undefined?{q}:{}),...(limit!==undefined?{limit}:{}),...(offset!==undefined?{offset}:{})});
    return noStoreJson({ classes });
  },
);
