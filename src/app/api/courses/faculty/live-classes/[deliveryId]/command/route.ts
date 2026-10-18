import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {createRequestId} from "@/lib/request-id";
import {FacultyAuthoringBodyError,readFacultyAuthoringBody}
  from "@/modules/courses/faculty-authoring-request-body";
import {commandFacultyLiveClass} from "@/modules/courses/faculty-live-mutation-service";

export const runtime="nodejs";
export async function POST(request:Request,{params}:{
  params:Promise<{deliveryId:string}>;
}) {
  if(!isSameOriginRequest(request))
    return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
  try {
    const result=await commandFacultyLiveClass(
      await getCurrentRequestContext(),await params,await readFacultyAuthoringBody(request));
    return NextResponse.json({result});
  }catch(error){
    if(error instanceof FacultyAuthoringBodyError){
      const requestId=createRequestId();
      const message=error.status===413
        ?"The live class request is too large. Shorten it and try again."
        :error.status===415
          ?"Send the live class request as JSON and try again."
          :"Check the live class details and try again.";
      return NextResponse.json({error:error.code,message,requestId},{
        status:error.status,headers:{"x-request-id":requestId},
      });
    }
    return apiErrorResponse(error);
  }
}
