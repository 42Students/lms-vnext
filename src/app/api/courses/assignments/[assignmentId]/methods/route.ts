import { route } from "@/security/route";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getLearnerAssignmentMethods} from "@/modules/courses/learner-assignment-methods-service";

import { CACHE } from "@/security/responses";
export const runtime="nodejs";
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const {assignmentId}=params;
    const deliveryId=new URL(request.url).searchParams.get("deliveryId");
    const methods=await getLearnerAssignmentMethods(context,assignmentId,deliveryId);
    return Response.json({methods},{headers:{"Cache-Control":CACHE.PRIVATE}});
  },
);
