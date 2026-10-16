import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {
  decideTpoRecruiterDriveRequest,TpoDriveRequestDecisionError,
} from "@/modules/placements/tpo-drive-request-decision-service";
export const runtime="nodejs";
export async function POST(request:Request,{params}:{
  params:Promise<{requestId:string}>,
}){
  if(!isSameOriginRequest(request))
    return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
  try{
    const {requestId}=await params;
    const response=await decideTpoRecruiterDriveRequest(
      await getCurrentRequestContext(),requestId,await request.json(),
    );
    return NextResponse.json(response,{headers:{"Cache-Control":"private, no-store"}});
  }catch(error){
    if(error instanceof TpoDriveRequestDecisionError)
      return NextResponse.json({error:error.code},{
        status:error.code==="REQUEST_NOT_FOUND"?404:409,
      });
    return apiErrorResponse(error);
  }
}
