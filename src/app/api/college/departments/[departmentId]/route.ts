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
    const department=await renameCollegeDepartment(context,departmentId,await request.json());
    return NextResponse.json({department,message:"Department updated successfully"},{
      headers:{"Cache-Control":"private, no-store"}
    });
  } catch (error) { return apiErrorResponse(error); }
}
/** The legacy DELETE was a destructive API; vNext archives for audit safety.
 * A dependency conflict stays HTTP 409 via apiErrorResponse:
 * {error:"DEPARTMENT_HAS_DEPENDENCIES",message,usage,requestId}.
 * Never echo raw database exception text or turn a conflict into success.
 */
export async function DELETE(request: Request, { params }: Params) {
  if (!isSameOriginRequest(request))
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  try {
    const context = await getCurrentRequestContext();
    const { departmentId } = await params;
    const department=await archiveCollegeDepartment(context,departmentId,await request.json());
    // Legacy DELETE was permanent. This route deliberately archives so
    // audit references survive; callers must not announce permanent deletion.
    return NextResponse.json({department,archived:true,
      message:"Department archived successfully"},{
      headers:{"Cache-Control":"private, no-store"}
    });
  } catch (error) { return apiErrorResponse(error); }
}
