import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  renameCollegeDepartment, archiveCollegeDepartment,
} from "@/modules/departments/college-department-mutation-service";

export const runtime = "nodejs";
type Params = { params: Promise<{ departmentId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  if (!isSameOriginRequest(request))
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  try {
    const context = await getCurrentRequestContext();
    const { departmentId } = await params;
    return NextResponse.json({ department: await renameCollegeDepartment(
      context, departmentId, await request.json(),
    ) });
  } catch (error) { return apiErrorResponse(error); }
}
export async function DELETE(request: Request, { params }: Params) {
  if (!isSameOriginRequest(request))
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  try {
    const context = await getCurrentRequestContext();
    const { departmentId } = await params;
    return NextResponse.json({ department: await archiveCollegeDepartment(
      context, departmentId, await request.json(),
    ) });
  } catch (error) { return apiErrorResponse(error); }
}
