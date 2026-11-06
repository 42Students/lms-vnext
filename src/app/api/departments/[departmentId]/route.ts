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
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { departmentId } = params;
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
    return NextResponse.json({ status: "OK", department, data: department, message: "Department updated successfully" });
  },
);

/** Legacy PUT maps to the same tenant-scoped UUID update as PATCH. */
export const PUT = PATCH;

export const DELETE = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: actor, params }) => {
    const context = actor!;
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
