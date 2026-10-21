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
export async function GET(_request: Request,{params}:RouteContext) {
 try {
  const {organizationId}=await params;
  const id=organizationIdSchema.safeParse(organizationId);
  if(!id.success)return NextResponse.json({
   error:"ORGANIZATION_NOT_FOUND",
   message:"Failed to fetch organization. Please try again or contact support.",
  },{status:404,headers:{"Cache-Control":"no-store"}});
  const rows=await listOrganizations(await getCurrentRequestContext());
  const organization=rows.find(item=>item.id===id.data);
  if(!organization)return NextResponse.json({
   error:"ORGANIZATION_NOT_FOUND",
   message:"Failed to fetch organization. Please try again or contact support.",
  },{status:404,headers:{"Cache-Control":"no-store"}});
  return NextResponse.json({organization},{headers:{"Cache-Control":"no-store"}});
 } catch(error) {
  return apiErrorResponse(error);
 }
}

export async function PATCH(
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
      body = await request.json();
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

export async function DELETE(
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
