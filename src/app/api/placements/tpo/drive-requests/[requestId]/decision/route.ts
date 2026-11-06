import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {
  decideTpoRecruiterDriveRequest,TpoDriveRequestDecisionError,
} from "@/modules/placements/tpo-drive-request-decision-service";
import { secured } from "@/security/secure-handler";
export const runtime="nodejs";
async function handlePOST(request:Request,{params}:{
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
export const POST = secured(handlePOST, { csrf: "enforce" });
