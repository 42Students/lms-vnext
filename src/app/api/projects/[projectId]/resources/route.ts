import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  createProjectResource,
  listProjectResources,
} from "@/modules/projects/resource-service";
import {
  getProjectResourceHistory,
  ProjectResourceHistoryUnavailable,
} from "@/modules/projects/resource-history-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

export async function GET(
  request: Request,
  { params }: RouteContext,
) {
  const query=new URL(request.url).searchParams;
  if([...query.keys()].some(key=>key!=="view") ||
     query.getAll("view").length>1 ||
     (query.has("view") && !["resources","audit"].includes(query.get("view")??"")))
    return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
  try {
    const context = await getCurrentRequestContext();
    const { projectId } = await params;
    if(query.get("view")==="audit"){
      const history=await getProjectResourceHistory(context,projectId);
      return NextResponse.json({
        message:"Resource audit retrieved",history:history.rows,
        hasMore:history.hasMore,
      },{headers:{"Cache-Control":"private, no-store"}});
    }
    const resources=await listProjectResources(context,projectId);
    return NextResponse.json({resources},{headers:{"Cache-Control":"private, no-store"}});
  } catch(error){
    if(error instanceof ProjectResourceHistoryUnavailable)
      return NextResponse.json({
        error:"RESOURCE_AUDIT_UNAVAILABLE",message:"Failed to fetch resource audit",
      },{status:503,headers:{"Cache-Control":"private, no-store"}});
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
    const { projectId } = await params;
    const body = await request.json();
    const resource = await createProjectResource(
      context,
      projectId,
      body,
    );

    return NextResponse.json(
      { resource },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
