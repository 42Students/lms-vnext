import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {createRequestId} from "@/lib/request-id";
import {FacultyAuthoringBodyError,readFacultyAuthoringBody}
  from "@/modules/courses/faculty-authoring-request-body";
import {commandFacultyAttendanceSchedule} from "@/modules/attendance/faculty-schedule-mutation-service";
export const runtime="nodejs";
export async function POST(request:Request,{params}:{
  params:Promise<{deliveryId:string}>;
}){
  if(!isSameOriginRequest(request))
    return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
  try{
    const result=await commandFacultyAttendanceSchedule(
      await getCurrentRequestContext(),await params,await readFacultyAuthoringBody(request));
    // The old ClassSchedule route returned Response(status=OK,data=...).
    // A UUID delivery is the authorized class/course mapping in vNext:
    // numeric legacy course/class IDs must not bypass its teaching guard.
    return NextResponse.json({result,data:result,status:"OK",message:"OK",
      scheduleHref:"/teacher/courses/"+encodeURIComponent((await params).deliveryId)+"/attendance"});
  }catch(error){
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
}
