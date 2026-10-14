import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {changeCollegeSectionLifecycle,CollegeSectionLifecycleError}
  from "@/modules/academics/college-section-lifecycle-service";
export const runtime="nodejs";
export async function PATCH(request:Request,{params}:{params:Promise<{sectionId:string}>}){
  if(!isSameOriginRequest(request))
    return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
  try{
    const {sectionId}=await params;
    return NextResponse.json({section:await changeCollegeSectionLifecycle(
      await getCurrentRequestContext(),sectionId,await request.json(),
    )});
  }catch(error){
    if(error instanceof CollegeSectionLifecycleError)
      return NextResponse.json({error:error.code},{
        status:error.code==="CLASS_NOT_FOUND"?404:409,
      });
    return apiErrorResponse(error);
  }
}
