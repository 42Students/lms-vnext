import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {readTpoBulkRequestBody,TpoBulkBodyError} from "@/modules/placements/tpo-bulk-request-body";
import { cancelTpoDriveWithPreview, getTpoDriveCancelPreview } from "@/modules/placements/tpo-drive-cancel-service";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const { jobId } = await params;
    return NextResponse.json(
      await cancelTpoDriveWithPreview(
        await getCurrentRequestContext(),
        jobId,
        await readTpoBulkRequestBody(request),
      ),
    );
  } catch (error) {
    if(error instanceof TpoBulkBodyError)return NextResponse.json({error:error.message},{
      status:error.status,headers:{"Cache-Control":"private, no-store"},
    });
    return apiErrorResponse(error);
  }
}

/** TPO-drives-13: read-only bulk preflight. Never mutates a job on GET. */
export async function GET(_request:Request,{params}:{params:Promise<{jobId:string}>}){
 try{
  const {jobId}=await params;
  return NextResponse.json(await getTpoDriveCancelPreview(await getCurrentRequestContext(),jobId),
   {headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
