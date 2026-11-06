import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {isSameOriginRequest} from "@/auth/origin";
import {updateMentorProjectOverview} from "@/modules/projects/mentor-overview-edit-service";
import {readMentorProjectCommandBody,MentorProjectCommandBodyError,mentorProjectBodyFailureMessage}
 from "@/modules/projects/mentor-command-body";
export const runtime="nodejs";
export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    try {
const {projectId}=params;
const updated=await updateMentorProjectOverview(__ctx,projectId,await readMentorProjectCommandBody(request));
return NextResponse.json({project:updated},{headers:{"Cache-Control":"private, no-store"}});
} catch(error){if(error instanceof MentorProjectCommandBodyError)
  return NextResponse.json({error:error.code,message:mentorProjectBodyFailureMessage(error.status)},
   {status:error.status});
 return apiErrorResponse(error);}
  },
);
