import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {lockMentorFinalDelivery} from "@/modules/projects/mentor-delivery-lock-service";
import {readMentorProjectCommandBody,MentorProjectCommandBodyError,mentorProjectBodyFailureMessage}
 from "@/modules/projects/mentor-command-body";
export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    try {
const {projectId,submissionId}=params;
const submission=await lockMentorFinalDelivery(__ctx,projectId,
   submissionId,await readMentorProjectCommandBody(request));
return NextResponse.json({submission});
} catch(error){if(error instanceof MentorProjectCommandBodyError)
  return NextResponse.json({error:error.code,message:mentorProjectBodyFailureMessage(error.status)},
   {status:error.status});
 return apiErrorResponse(error);}
  },
);
