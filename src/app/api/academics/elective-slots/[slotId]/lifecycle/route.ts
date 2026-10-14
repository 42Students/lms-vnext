import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {changeCollegeElectiveLifecycle,ElectiveLifecycleError}
  from "@/modules/electives/college-elective-lifecycle-service";
export const runtime="nodejs";
export async function PATCH(request:Request,{params}:{
  params:Promise<{slotId:string}>;
}) {
  if(!isSameOriginRequest(request))
    return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
  try {
    const {slotId}=await params;
    return NextResponse.json({slot:await changeCollegeElectiveLifecycle(
      await getCurrentRequestContext(),slotId,await request.json(),
    )});
  }catch(error) {
    if(error instanceof ElectiveLifecycleError)
      return NextResponse.json({error:error.code},{status:
        error.code==="ELECTIVE_SLOT_NOT_FOUND"?404:409});
    return apiErrorResponse(error);
  }
}
