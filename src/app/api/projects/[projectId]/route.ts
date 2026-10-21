import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import {isSameOriginRequest} from "@/auth/origin";
import {updateCollegeProjectSummary} from "@/modules/projects/college-project-summary-service";
import {
  getProjectInstanceWorkspace,
} from "@/modules/projects/instance-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const context = await getCurrentRequestContext();
    const { projectId } = await params;
    const workspace =
      await getProjectInstanceWorkspace(
        context,
        projectId,
      );

    return NextResponse.json({ workspace });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(request:Request,{params}:RouteContext){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {projectId}=await params;
  const input:unknown=await request.json();
  // Legacy workspace-wide PATCH bundled nested sections with section tokens.
  // New vNext summary CAS cannot atomically apply these nested operations:
  // clients must use authorized, versioned section endpoints separately.
  if(input && typeof input==="object" && !Array.isArray(input) &&
     ["releases","sprints","tasks","resources","sectionTokens","sections"].some(
      key=>Object.prototype.hasOwnProperty.call(input,key)))
   return NextResponse.json({error:"USE_VERSIONED_SECTION_ENDPOINTS"},{status:400});
  const updated=await updateCollegeProjectSummary(await getCurrentRequestContext(),projectId,input);
  return NextResponse.json({project:updated},{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
