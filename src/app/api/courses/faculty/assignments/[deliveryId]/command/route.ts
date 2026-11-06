import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {createRequestId} from "@/lib/request-id";
import {readFacultyAssignmentCommandBody,FacultyAssignmentBodyError}
  from "@/modules/courses/faculty-assignment-request-body";
import {commandFacultyAssignment} from "@/modules/courses/faculty-assignment-authoring-service";
export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const context = __actor!;
    try {
const {deliveryId}=params;
const body=await readFacultyAssignmentCommandBody(request);
const assignment=await commandFacultyAssignment(context,{deliveryId},body);
return NextResponse.json({assignment});
} catch(error){
    if(error instanceof FacultyAssignmentBodyError){
      const requestId=createRequestId();
      const message=error.status===413
        ?"The assignment is too large. Shorten it and try again."
        :error.status===415
          ?"Send the assignment as JSON and try again."
          :"Check the assignment data and try again.";
      return NextResponse.json({error:error.code,message,requestId},{
        status:error.status,headers:{"x-request-id":requestId},
      });
    }
    return apiErrorResponse(error);
  }
  },
);
