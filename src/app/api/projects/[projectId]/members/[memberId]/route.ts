import { boundedRequestJson } from "@/lib/bounded-request-json";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  endProjectMember,
  updateProjectMember,
} from "@/modules/projects/member-service";
import { route } from "@/security/route";

import { CACHE } from "@/security/responses";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    projectId: string;
    memberId: string;
  }>;
};

async function handlePATCH(
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
    const { projectId, memberId } = await params;
    const body = await boundedRequestJson(request);
    const member = await updateProjectMember(
      context,
      projectId,
      memberId,
      body,
    );

    return NextResponse.json({ member });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  ({ request, params }) => handlePATCH(request as Parameters<typeof handlePATCH>[0], { params: Promise.resolve(params) } as Parameters<typeof handlePATCH>[1]),
);

async function handleDELETE(
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
    const { projectId, memberId } = await params;
    const member = await endProjectMember(
      context,
      projectId,
      memberId,
    );

    return NextResponse.json({ member });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
export const DELETE = route(
  { auth: "user", permission: "service-enforced" },
  ({ request, params }) => handleDELETE(request as Parameters<typeof handleDELETE>[0], { params: Promise.resolve(params) } as Parameters<typeof handleDELETE>[1]),
);

/** Historic POST /members/:id/remove adapter. Unlike DELETE it requires an
 * explicit action so a misrouted form POST cannot silently remove someone.
 * The shared writer rechecks project membership and permissions. */
async function handlePOST(request:Request,route:RouteContext){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 const input:unknown=await boundedRequestJson(request).catch(()=>null);
 if(!input||typeof input!=="object"||Array.isArray(input)||
   (input as {action?:unknown}).action!=="REMOVE")
  return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
 try{
  const {projectId,memberId}=await route.params;
  const result=await endProjectMember(
   await getCurrentRequestContext(),projectId,memberId);
  return NextResponse.json({member:result},
   {headers:{"Deprecation":"true","Cache-Control":CACHE.PRIVATE}});
 }catch(error){return apiErrorResponse(error);}
}
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  ({ request, params }) => handlePOST(request as Parameters<typeof handlePOST>[0], { params: Promise.resolve(params) } as Parameters<typeof handlePOST>[1]),
);
