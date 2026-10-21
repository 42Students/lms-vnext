import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { createClassTeamWorkspaces } from "@/modules/projects/class-team-workspace-service";

export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const context = await getCurrentRequestContext();
    const result = await createClassTeamWorkspaces(context, await request.json());
    const repaired=result.teamCount>0&&result.alreadyCovered>0;
    const unchanged=result.teamCount===0&&result.alreadyCovered>0;
    return NextResponse.json({
      ...result,createdCount:result.teamCount,repairedCount:repaired?result.teamCount:0,
      unchangedCount:result.alreadyCovered,
      message:unchanged?"Team already in step":repaired?"Team repaired":"Project teams created",
      outcomes:result.individualResults,
    }, {status:unchanged?200:201,headers:{"Cache-Control":"no-store"}});
  } catch(error) {
    // A missing project table is a deployment dependency, not a partial team
    // creation. The service transaction rolls back all groups and projects.
    let cause:unknown=error;
    for(let depth=0;depth<4;depth++){
      if(cause&&typeof cause==="object"&&(cause as {code?:unknown}).code==="42P01")
        return NextResponse.json({error:"PROJECT_TEAMS_UNAVAILABLE",
          message:"Project teams are not available. Try again after project storage is configured."},
          {status:503,headers:{"Cache-Control":"no-store","Retry-After":"60"}});
      cause=cause&&typeof cause==="object"?(cause as {cause?:unknown}).cause:null;
    }
    return apiErrorResponse(error);
  }
}
