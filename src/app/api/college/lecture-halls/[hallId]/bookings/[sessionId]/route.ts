import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {cancelCollegeHallBooking,CollegeHallCancelError}
  from "@/modules/academics/college-hall-cancel-service";
export const runtime="nodejs";
export async function PATCH(request:Request,{params}:{
  params:Promise<{hallId:string;sessionId:string}>;
}){
  if(!isSameOriginRequest(request))
    return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
  try{
    const {hallId,sessionId}=await params;
    return NextResponse.json({session:await cancelCollegeHallBooking(
      await getCurrentRequestContext(),hallId,sessionId,await request.json(),
    )});
  }catch(error){
    if(error instanceof CollegeHallCancelError)
      return NextResponse.json({error:error.code},{
        status:error.code==="HALL_SESSION_NOT_FOUND"?404:409,
      });
    return apiErrorResponse(error);
  }
}
