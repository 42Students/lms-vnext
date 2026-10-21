import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { bulkReassignProjectMentor } from "@/modules/projects/member-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }

  try {
    const context =
      await getCurrentRequestContext();
    let input:unknown;
    try{input=await request.json();}
    catch{return NextResponse.json({error:"INVALID_REQUEST"},{status:400});}
    if(input&&typeof input==="object"&&!Array.isArray(input)){
      const raw=input as Record<string,unknown>;
      // A selected single project is the one-element form of the bulk
      // transaction. No old integer ID is accepted as a project or mentor.
      if(typeof raw.projectId==="string"&&raw.projectIds===undefined){
        const {projectId,...rest}=raw;
        input={...rest,projectIds:[projectId]};
      }
    }
    // Old numeric mentorId is not a persisted membership UUID. Importers must
    // resolve it against the selected college before invoking this route.
    if(input && typeof input==="object" && !Array.isArray(input) &&
       "mentorId" in input && !("mentorMembershipId" in input))
      return NextResponse.json({error:"MENTOR_MEMBERSHIP_ID_REQUIRED"},{status:400});
    const result =
      await bulkReassignProjectMentor(
        context,
        input,
      );
    return NextResponse.json({...result,
      partialSuccess:result.failures.length>0&&result.reassignedCount>0,
      failedProjects:result.failures,
    },{headers:{"Cache-Control":"private, no-store"}});
  } catch (error) {
    return apiErrorResponse(error);
  }
}
