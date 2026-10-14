import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {writeCollegeGroupDetail,CollegeGroupDetailWriteError}
  from "@/modules/groups/college-group-detail-write-service";
export const runtime="nodejs";
type RouteContext={params:Promise<{groupId:string}>};
export async function PATCH(request:Request,{params}:RouteContext) {
  if(!isSameOriginRequest(request))
    return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
  try {
    const {groupId}=await params;
    return NextResponse.json(await writeCollegeGroupDetail(
      await getCurrentRequestContext(),groupId,await request.json(),
    ));
  }catch(error) {
    if(error instanceof CollegeGroupDetailWriteError)
      return NextResponse.json({error:error.code},{
        status:error.code==="GROUP_NOT_FOUND"||error.code==="MEMBER_NOT_FOUND"?404:409,
      });
    return apiErrorResponse(error);
  }
}
