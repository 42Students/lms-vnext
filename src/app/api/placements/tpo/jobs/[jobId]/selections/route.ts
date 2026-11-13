import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {readTpoBulkRequestBody,TpoBulkBodyError} from "@/modules/placements/tpo-bulk-request-body";
import { getTpoSelectionWorkspace, recordTpoDriveSelections, verifyAndReleaseTpoSelections } from "@/modules/placements/tpo-drive-selection-service";

import { CACHE, privateJson } from "@/security/responses";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Props = { params: Promise<{jobId:string}> };

export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor, params }) => {
    const __ctx = __actor!;
    const {jobId}=params;
    return NextResponse.json(await getTpoSelectionWorkspace(__ctx,jobId),{
      headers:{"Cache-Control":CACHE.PRIVATE},
    });
  },
);
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const context = __actor!;
    try {
const {jobId}=params;
const body=await readTpoBulkRequestBody(request);
const result=body["action"]==="RECORD"
      ? await recordTpoDriveSelections(context,jobId,body)
      : body["action"]==="VERIFY_AND_RELEASE"
        ? await verifyAndReleaseTpoSelections(context,jobId,body)
        : null;
if(!result)return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
return privateJson(result);
} catch(error){
    if(error instanceof TpoBulkBodyError)return NextResponse.json({error:error.message},
      {status:error.status,headers:{"Cache-Control":CACHE.PRIVATE}});
    return apiErrorResponse(error);
  }
  },
);
