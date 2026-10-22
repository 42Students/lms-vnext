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
  if([...query.keys()].some(key=>key!=="view"&&key!=="page"&&key!=="resourceKey") ||
     query.getAll("page").length>1 ||
     query.getAll("resourceKey").length>1 ||
     (query.has("resourceKey")&&query.get("view")!=="audit") ||
     (query.has("page") && !/^[1-9][0-9]{0,4}$/.test(query.get("page")??"")) ||
     (query.has("page") && query.get("view")!=="audit") ||
     query.getAll("view").length>1 ||
     (query.has("view") && !["resources","audit"].includes(query.get("view")??"")))
    return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
  try {
    const context = await getCurrentRequestContext();
    const { projectId } = await params;
    if(query.get("view")==="audit"){
      const history=await getProjectResourceHistory(context,projectId,{
        page:query.get("page")??"1",pageSize:10,
        ...(query.get("resourceKey")?{resourceKey:query.get("resourceKey")}:{}),
      });
      const first=history.rows.length?(history.page-1)*history.pageSize+1:0;
      const last=history.rows.length?first+history.rows.length-1:0;
      return NextResponse.json({
        message:"Resource audit retrieved",history:history.rows,
        hasMore:history.hasMore,
        pagination:{page:history.page,pageSize:history.pageSize,
          total:history.total,totalPages:history.pageCount,
          totalLoaded:history.rows.length,
          rangeLabel:first+"–"+last+" of "+history.total+" matching changes",
          hasUnloadedHistory:history.hasMore},
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
