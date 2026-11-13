import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";

import {publishAssignmentGradeBatch} from "@/modules/courses/assignment-bulk-grade-publish-service";

import { privateJson } from "@/security/responses";
export const runtime="nodejs";

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const {assignmentId}=params;
    const body=await boundedRequestJson(request);
    const receipt=await publishAssignmentGradeBatch(context,assignmentId,body);
    return privateJson(receipt);
  },
);
