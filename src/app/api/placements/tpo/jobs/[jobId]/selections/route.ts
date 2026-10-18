import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {readTpoBulkRequestBody,TpoBulkBodyError} from "@/modules/placements/tpo-bulk-request-body";
import { getTpoSelectionWorkspace, recordTpoDriveSelections, verifyAndReleaseTpoSelections } from "@/modules/placements/tpo-drive-selection-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Props = { params: Promise<{jobId:string}> };

export async function GET(_request:Request,{params}:Props){
  try{
    const {jobId}=await params;
    return NextResponse.json(await getTpoSelectionWorkspace(await getCurrentRequestContext(),jobId),{
      headers:{"Cache-Control":"private, no-store"},
    });
  }catch(error){
    return apiErrorResponse(error);
  }
}
export async function POST(request:Request,{params}:Props){
  if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
  try{
    const {jobId}=await params;
    const context=await getCurrentRequestContext();
    const body=await readTpoBulkRequestBody(request);
    const result=body.action==="RECORD"
      ? await recordTpoDriveSelections(context,jobId,body)
      : body.action==="VERIFY_AND_RELEASE"
        ? await verifyAndReleaseTpoSelections(context,jobId,body)
        : null;
    if(!result)return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
    return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
  }catch(error){
    if(error instanceof TpoBulkBodyError)return NextResponse.json({error:error.message},
      {status:error.status,headers:{"Cache-Control":"private, no-store"}});
    return apiErrorResponse(error);
  }
}
