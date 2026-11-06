import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  endProjectMember,
  updateProjectMember,
} from "@/modules/projects/member-service";
import { secured } from "@/security/secure-handler";

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
    const body = await request.json();
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
export const PATCH = secured(handlePATCH);

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
export const DELETE = secured(handleDELETE);

/** Historic POST /members/:id/remove adapter. Unlike DELETE it requires an
 * explicit action so a misrouted form POST cannot silently remove someone.
 * The shared writer rechecks project membership and permissions. */
async function handlePOST(request:Request,route:RouteContext){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 const input:unknown=await request.json().catch(()=>null);
 if(!input||typeof input!=="object"||Array.isArray(input)||
   (input as {action?:unknown}).action!=="REMOVE")
  return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
 try{
  const {projectId,memberId}=await route.params;
  const result=await endProjectMember(
   await getCurrentRequestContext(),projectId,memberId);
  return NextResponse.json({member:result},
   {headers:{"Deprecation":"true","Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
export const POST = secured(handlePOST, { csrf: "enforce" });
