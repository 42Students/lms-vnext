import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {lockAdminProjectSubmission} from "@/modules/projects/admin-submission-review-service";
import {readLimitedProjectLockInput} from "@/modules/projects/admin-lock-request-model";
import { privateJson } from "@/security/responses";
export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const command=await readLimitedProjectLockInput(request);
    if(!command.ok)
    return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
    const {projectId,submissionId}=params;
    const submission=await lockAdminProjectSubmission(__ctx,
   projectId,submissionId,command.value);
    return privateJson({submission});
  },
);
