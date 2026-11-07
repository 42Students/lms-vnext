import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {createMentorProjectTask} from "@/modules/projects/mentor-task-create-service";
import {createLearnerOwnTask} from "@/modules/projects/learner-own-task-service";
import {requireProjectReadAccess} from "@/modules/projects/access";
import {ProjectsServiceError} from "@/modules/projects/errors";
import {readMentorProjectCommandBody,MentorProjectCommandBodyError,mentorProjectBodyFailureMessage} from "@/modules/projects/mentor-command-body";

export const runtime="nodejs";
type RouteContext={params:Promise<{projectId:string}>};
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const context = __actor!;
    try {
const path=params;
const body=await readMentorProjectCommandBody(request);
const scope=await requireProjectReadAccess(context,path.projectId);
if(scope.access!=="LEARNER" && scope.access!=="MENTOR")
      throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
const task=scope.access==="LEARNER"
      ? await createLearnerOwnTask(context,path,body)
      : await createMentorProjectTask(context,path,body);
return NextResponse.json({task,message:"Project tasks updated"},{status:201});
} catch(error){
    if(error instanceof MentorProjectCommandBodyError)
      return NextResponse.json({error:error.code,message:mentorProjectBodyFailureMessage(error.status)},
        {status:error.status,headers:{"Cache-Control":"no-store"}});
    return apiErrorResponse(error);
  }
  },
);
