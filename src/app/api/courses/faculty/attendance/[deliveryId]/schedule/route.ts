import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {createRequestId} from "@/lib/request-id";
import {FacultyAuthoringBodyError,readFacultyAuthoringBody}
  from "@/modules/courses/faculty-authoring-request-body";
import {commandFacultyAttendanceSchedule} from "@/modules/attendance/faculty-schedule-mutation-service";
export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    try {
const result=await commandFacultyAttendanceSchedule(
      __ctx,params,await readFacultyAuthoringBody(request));
return NextResponse.json({result,data:result,status:"OK",message:"OK",
      scheduleHref:"/teacher/courses/"+encodeURIComponent((params).deliveryId)+"/attendance"});
} catch(error){
    if(error instanceof FacultyAuthoringBodyError){
      const requestId=createRequestId();
      const message=error.status===413
        ?"The class schedule request is too large. Shorten it and try again."
        :error.status===415
          ?"Send the class schedule request as JSON and try again."
          :"Check the class schedule details and try again.";
      return NextResponse.json({error:error.code,message,requestId},{
        status:error.status,headers:{"x-request-id":requestId},
      });
    }
    return apiErrorResponse(error);
  }
  },
);
