import { boundedRequestJson } from "@/lib/request-body";
import { route } from "@/security/route";
import { NextResponse } from "next/server";
import {
  renameCollegeDepartment, archiveCollegeDepartment,
} from "@/modules/departments/college-department-mutation-service";

import { CACHE } from "@/security/responses";
export const runtime = "nodejs";

export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { departmentId } = params;
    const department=await renameCollegeDepartment(context,departmentId,await boundedRequestJson(request));
    return NextResponse.json({department,message:"Department updated successfully"},{
      headers:{"Cache-Control":CACHE.PRIVATE}
    });
  },
);
/** The legacy DELETE was a destructive API; vNext archives for audit safety.
 * A dependency conflict stays HTTP 409 via apiErrorResponse:
 * {error:"DEPARTMENT_HAS_DEPENDENCIES",message,usage,requestId}.
 * Never echo raw database exception text or turn a conflict into success.
 */
export const DELETE = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { departmentId } = params;
    const department=await archiveCollegeDepartment(context,departmentId,await boundedRequestJson(request));
    return NextResponse.json({department,archived:true,
      message:"Department archived successfully"},{
      headers:{"Cache-Control":CACHE.PRIVATE}
    });
  },
);
