import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {placementJobIdSchema} from "@/modules/placements/validation";
import {PlacementsServiceError} from "@/modules/placements/errors";
import {
  applyToPlacementJob,
  listPlacementJobApplications,
} from "@/modules/placements/application-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ jobId: string }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const context = await getCurrentRequestContext();
    const { jobId } = await params;
    const applications =
      await listPlacementJobApplications(
        context,
        jobId,
      );
    return NextResponse.json({ applications });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(
  request: Request,
  { params }: RouteContext,
) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }

  try {
    const context = await getCurrentRequestContext();
    const { jobId } = await params;
    if(!placementJobIdSchema.safeParse(jobId).success)
      return NextResponse.json({error:"INVALID_REQUEST",
        message:"This drive link is invalid. Open the drive from your college placements page."},
        {status:400,headers:{"Cache-Control":"private, no-store"}});
    const application = await applyToPlacementJob(
      context,
      jobId,
      await request.json(),
    );
    return NextResponse.json(
      { application,
        message:"Application submitted. Screening will be completed shortly.",
        screeningStatus:"PENDING_REVIEW",
      },
      {status:201,headers:{"Cache-Control":"private, no-store"}},
    );
  } catch (error) {
    const response=apiErrorResponse(error);
    if(error instanceof PlacementsServiceError){
      // Keep source-specific machine errors, status and correlation headers.
      const guidance:Partial<Record<string,{message:string;actionHref:string}>>={
        PLACEMENT_APPLICATION_NEEDS_DATA:{
          message:"Complete your placement profile and attach your own verified resume or proof where required.",
          actionHref:"/learn/profile",
        },
        PLACEMENT_APPLICATION_INELIGIBLE:{
          message:"You are not eligible for this drive right now. Check registration, verified profile, and placement rules.",
          actionHref:"/learn/my-placements/rules",
        },
        PLACEMENT_APPLICATION_JOB_NOT_OPEN:{
          message:"This drive is no longer open for applications.",
          actionHref:"/learn/my-placements/jobs",
        },
        PLACEMENT_APPLICATION_DEADLINE_PASSED:{
          message:"This drive's application deadline has passed.",
          actionHref:"/learn/my-placements/jobs",
        },
        PLACEMENT_APPLICATION_CHANNEL_INVALID:{
          message:"Choose an application method supported by this drive.",
          actionHref:"/learn/my-placements/jobs",
        },
        PLACEMENT_ROLE_OPTION_REQUIRED:{
          message:"Choose a role before submitting your application.",
          actionHref:"/learn/my-placements/jobs",
        },
      };
      const selected=guidance[error.code];
      if(selected){
        const body=await response.json() as Record<string,unknown>;
        return NextResponse.json({...body,...selected},
          {status:response.status,headers:response.headers});
      }
    }
    return response;
  }
}