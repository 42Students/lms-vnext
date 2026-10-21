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
    const { departmentId } = await params;

    let body: unknown;
    try {
      body = await request.json();
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

    return NextResponse.json({ department, message: "Department updated successfully" });
  } catch (error) {
    // The source controller treated update failures as 400; keep its
    // validation feedback without changing vNext access/tenant protections.
    if(error instanceof ZodError)
      return NextResponse.json({error:"INVALID_REQUEST",
        message:error.issues[0]?.message??"Please check the department name."},{status:400});
    if(error instanceof DepartmentServiceError&&error.code==="DEPARTMENT_NAME_CONFLICT")
      return NextResponse.json({error:error.code,
        message:"A department with this name already exists."},{status:409});
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
    const context =
      await getCurrentRequestContext();
    const { departmentId } = await params;
    const department =
      await archiveDepartment(
        context,
        departmentId,
      );

    // Retain the legacy success text for compatible toast consumers, while
    // truthfully declaring the non-destructive archived state to modern ones.
    return NextResponse.json({ department, archived:true,
      message:"Department deleted successfully" });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
