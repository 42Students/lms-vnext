import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { createClassTeamWorkspaces } from "@/modules/projects/class-team-workspace-service";

export const runtime = "nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor }) => {
    const context = actor!;
    const result = await createClassTeamWorkspaces(context, await request.json());
    const repaired=result.teamCount>0&&result.alreadyCovered>0;
    const unchanged=result.teamCount===0&&result.alreadyCovered>0;
    return NextResponse.json({
      ...result,createdCount:result.teamCount,repairedCount:repaired?result.teamCount:0,
      unchangedCount:result.alreadyCovered,
      message:unchanged?"Team already in step":repaired?"Team repaired":"Project teams created",
      outcomes:result.individualResults,
      preflightHref:"/api/projects/cohort-preflight",
      scope:"SELECTED_COLLEGE",
      atomic:true,
      noEligible:result.teamCount===0&&result.alreadyCovered===0,
      partialFailure:false,
      countSummary:{created:result.teamCount,alreadyCovered:result.alreadyCovered},
      nextAction:result.teamCount===0?"REVIEW_CLASS_OR_TEMPLATE":"OPEN_TEAM_WORKSPACES",
    }, {status:unchanged?200:201,headers:{"Cache-Control":"no-store"}});
  },
);
