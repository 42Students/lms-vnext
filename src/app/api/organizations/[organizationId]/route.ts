import { boundedRequestJson } from "@/lib/bounded-request-json";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import {
  archiveOrganization,
  renameOrganization,
} from "@/modules/organizations/service";
import { apiErrorResponse } from "@/lib/api-error";
import { organizationIdSchema } from "@/modules/organizations/validation";
import { listOrganizations } from "@/modules/organizations/service";
import { route } from "@/security/route";

import { CACHE, noStoreJson } from "@/security/responses";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    organizationId: string;
  }>;
};

/** A per-ID read must respect the persisted actor's selected tenant scope.
 * listOrganizations rechecks that scope in its read transaction, so no
 * arbitrary organization UUID can expose a record outside the current tenant.
 */
async function handleGET(_request: Request,{params}:RouteContext) {
 try {
  const {organizationId}=await params;
  const id=organizationIdSchema.safeParse(organizationId);
  if(!id.success)return NextResponse.json({
   error:"ORGANIZATION_NOT_FOUND",
   message:"Failed to fetch organization. Please try again or contact support.",
  },{status:404,headers:{"Cache-Control":CACHE.NONE}});
  const rows=await listOrganizations(await getCurrentRequestContext());
  const organization=rows.find(item=>item.id===id.data);
  if(!organization)return NextResponse.json({
   error:"ORGANIZATION_NOT_FOUND",
   message:"Failed to fetch organization. Please try again or contact support.",
  },{status:404,headers:{"Cache-Control":CACHE.NONE}});
  return noStoreJson({organization});
 } catch(error) {
  return apiErrorResponse(error);
 }
}
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  ({ request, params }) => handleGET(request as Parameters<typeof handleGET>[0], { params: Promise.resolve(params) } as Parameters<typeof handleGET>[1]),
);

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
    const { organizationId } = await params;

    let body: unknown;
    try {
      body = await boundedRequestJson(request);
    } catch {
      return NextResponse.json(
        { error: "INVALID_REQUEST" },
        { status: 400 },
      );
    }

    const organization = await renameOrganization(
      context,
      organizationId,
      body as { name: string },
    );

    return NextResponse.json({ organization, message:"Organization updated successfully." });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  ({ request, params }) => handlePATCH(request as Parameters<typeof handlePATCH>[0], { params: Promise.resolve(params) } as Parameters<typeof handlePATCH>[1]),
);

/** Legacy PUT /fetch-update callers may send the same complete name payload.
 * Keep the vNext origin, role, schema and archived-parent checks in PATCH. */
async function handlePUT(request: Request, context: RouteContext) {
  if (!isSameOriginRequest(request))
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  return PATCH(request, context);
}
export const PUT = route(
  { auth: "user", permission: "service-enforced" },
  ({ request, params }) => handlePUT(request as Parameters<typeof handlePUT>[0], { params: Promise.resolve(params) } as Parameters<typeof handlePUT>[1]),
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
    const { organizationId } = await params;
    const organization = await archiveOrganization(
      context,
      organizationId,
    );

    // Archive is recoverable in vNext; never suggest the record was deleted.
    return NextResponse.json({ organization, message:"Organization archived successfully." });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
export const DELETE = route(
  { auth: "user", permission: "service-enforced" },
  ({ request, params }) => handleDELETE(request as Parameters<typeof handleDELETE>[0], { params: Promise.resolve(params) } as Parameters<typeof handleDELETE>[1]),
);
