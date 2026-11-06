import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {postMentorProjectUpdate} from "@/modules/projects/mentor-project-update-service";
import {readMentorProjectCommandBody,MentorProjectCommandBodyError,
  mentorProjectBodyFailureMessage} from "@/modules/projects/mentor-command-body";

export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    try {
const {projectId}=params;
const body=await readMentorProjectCommandBody(request,4096);
const posted=await postMentorProjectUpdate(__ctx,projectId,body);
return NextResponse.json({id:posted.id,message:"Project update posted"},{status:201,
      headers:{"Cache-Control":"private, no-store"}});
} catch(error){
    if(error instanceof MentorProjectCommandBodyError){
      return NextResponse.json({
        error:error.status===413?"UPDATE_TOO_LONG":
          error.status===400?"INVALID_JSON":error.code,
        message:mentorProjectBodyFailureMessage(error.status),
      },{status:error.status,headers:{"Cache-Control":"no-store"}});
    }
    return apiErrorResponse(error);
  }
  },
);
