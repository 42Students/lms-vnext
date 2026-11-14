import { route } from "@/security/route";
import { z } from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { loadClassTeamRoster } from "@/modules/projects/class-team-roster-service";

import { noStoreJson } from "@/security/responses";
import { zUuid } from "@/lib/schema-primitives";
export const runtime = "nodejs";
const querySchema = z.object({ collegeId: zUuid, classId: zUuid }).strict();
export const GET = route(
  { auth: "user", permission: "projects.manage" },
  async ({ request, context: actor }) => {
    const context = actor!;
    const url = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(url.searchParams));
    const roster = await loadClassTeamRoster(context, query.collegeId, query.classId);
    return noStoreJson({ roster });
  },
);
