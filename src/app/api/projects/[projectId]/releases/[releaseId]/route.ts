import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {readMentorProjectCommandBody,MentorProjectCommandBodyError,mentorProjectBodyFailureMessage}
 from "@/modules/projects/mentor-command-body";
import {writeMentorProjectRelease} from "@/modules/projects/mentor-release-write-service";
export const runtime="nodejs";
type Route={params:Promise<{projectId:string;releaseId:string}>};
export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    try {
const {projectId,releaseId}=params;
const result=await writeMentorProjectRelease(__ctx,projectId,releaseId,"PATCH",await readMentorProjectCommandBody(request));
return NextResponse.json(result);
} catch(error) {
    if(error instanceof MentorProjectCommandBodyError)
      return NextResponse.json({error:error.code,message:mentorProjectBodyFailureMessage(error.status)},
        {status:error.status});
    return apiErrorResponse(error);
  }
  },
);
export const DELETE = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    try {
const {projectId,releaseId}=params;
const result=await writeMentorProjectRelease(__ctx,projectId,releaseId,"DELETE",await readMentorProjectCommandBody(request));
return NextResponse.json(result);
} catch(error) {
    if(error instanceof MentorProjectCommandBodyError)
      return NextResponse.json({error:error.code,message:mentorProjectBodyFailureMessage(error.status)},
        {status:error.status});
    return apiErrorResponse(error);
  }
  },
);
