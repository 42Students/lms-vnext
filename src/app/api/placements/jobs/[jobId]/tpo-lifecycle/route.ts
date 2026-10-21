import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {PlacementsServiceError} from "@/modules/placements/errors";
import {placementJobIdSchema} from "@/modules/placements/validation";
import { changeTpoDriveLifecycle,TpoPublishEmailUnavailable } from "@/modules/placements/tpo-drive-lifecycle-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: {
  params: Promise<{ jobId: string }>;
}) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const context = await getCurrentRequestContext();
    const { jobId } = await params;
    if(!placementJobIdSchema.safeParse(jobId).success)
      return NextResponse.json({error:"PLACEMENT_JOB_NOT_FOUND",
        message:"This drive no longer exists or its link is invalid."},{status:404});
    const body:unknown=await request.json().catch(()=>null);
    if(!body||typeof body!=="object"||Array.isArray(body))
      return NextResponse.json({error:"INVALID_REQUEST",
        message:"Choose a drive lifecycle action and try again."},{status:400});
    return NextResponse.json(await changeTpoDriveLifecycle(context,jobId,body),
      {headers:{"Cache-Control":"private, no-store"}});
  } catch (error) {
    if(error instanceof TpoPublishEmailUnavailable)
      return NextResponse.json({error:error.message,
        message:"Drive status has not changed because the required email delivery is unavailable. Retry when notifications are restored."},
        {status:422,headers:{"Cache-Control":"private, no-store"}});
    const response=apiErrorResponse(error);
    if(error instanceof PlacementsServiceError){
      const explanation:Partial<Record<string,string>>={
        PLACEMENT_JOB_NOT_FOUND:"This drive no longer exists or you cannot access it.",
        PLACEMENT_JOB_READ_ONLY:"This drive cannot change status from its current state. Refresh it before retrying.",
        PLACEMENT_JOB_NOT_PUBLISHABLE:"Complete the required drive details, roles and eligibility before publishing.",
        PLACEMENT_JOB_NOT_CLOSABLE:"This drive has pending selections or offers that must be resolved before closing.",
        PLACEMENT_JOB_STALE:"This drive changed since you opened it. Refresh and review before retrying.",
      };
      const message=explanation[error.code];
      if(message){
        const body=await response.json() as Record<string,unknown>;
        return NextResponse.json({...body,message},
          {status:response.status,headers:response.headers});
      }
    }
    return response;
  }
}
