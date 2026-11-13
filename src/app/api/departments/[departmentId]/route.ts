import { boundedRequestJson } from "@/lib/request-body";
import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import {
  archiveDepartment,
  renameDepartment,
} from "@/modules/departments/service";
import { apiErrorResponse } from "@/lib/api-error";
import { ZodError } from "zod";
import { DepartmentServiceError } from "@/modules/departments/service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    departmentId: string;
  }>;
};

export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const context = __actor!;
    try {
const { departmentId } = params;
let body: unknown;
try {
      body = await boundedRequestJson(request);
    } catch {
      return NextResponse.json(
        { error: "INVALID_REQUEST" },
        { status: 400 },
      );
    }
const department = await renameDepartment(
      context,
      departmentId,
      body as { name: string },
    );
return NextResponse.json({ status: "OK", department, data: department, message: "Department updated successfully" });
} catch (error) {
    // The source controller treated update failures as 400; keep its
    // validation feedback without changing vNext access/tenant protections.
    if(error instanceof ZodError)
      return NextResponse.json({error:"INVALID_REQUEST",
        message:error.issues[0]?.message??"Please check the department name.",
        fieldErrors:Object.fromEntries(error.issues.map(issue=>[String(issue.path[0]??"name"),issue.message]))},{status:400});
    if(error instanceof DepartmentServiceError&&error.code==="DEPARTMENT_NAME_CONFLICT")
      return NextResponse.json({error:error.code,
        message:"A department with this name already exists."},{status:409});
    const response = apiErrorResponse(error);
    if (response.status >= 500) return NextResponse.json({ error: "DEPARTMENT_UPDATE_FAILED",
      message: "Please try again or contact support" }, { status: response.status });
    return response;
  }
  },
);

/** Legacy PUT maps to the same tenant-scoped UUID update as PATCH. */
export const PUT = PATCH;

export const DELETE = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor, params }) => {
    const context = __actor!;
    const { departmentId } = params;
    const department =
      await archiveDepartment(
        context,
        departmentId,
      );
    return NextResponse.json({ department, archived:true,
      message:"Department deleted successfully" });
  },
);
