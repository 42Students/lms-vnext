import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {PlacementsServiceError} from "@/modules/placements/errors";
import {placementJobIdSchema} from "@/modules/placements/validation";
import { changeTpoDriveLifecycle,TpoPublishEmailUnavailable } from "@/modules/placements/tpo-drive-lifecycle-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { jobId } = params;
    if(!placementJobIdSchema.safeParse(jobId).success)
      return NextResponse.json({error:"PLACEMENT_JOB_NOT_FOUND",
        message:"This drive no longer exists or its link is invalid."},{status:404});
    const body:unknown=await request.json().catch(()=>null);
    if(!body||typeof body!=="object"||Array.isArray(body))
      return NextResponse.json({error:"INVALID_REQUEST",
        message:"Choose a drive lifecycle action and try again."},{status:400});
    return NextResponse.json(await changeTpoDriveLifecycle(context,jobId,body),
      {headers:{"Cache-Control":"private, no-store"}});
  },
);
