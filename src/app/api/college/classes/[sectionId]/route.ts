import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  CollegeSectionError, updateCollegeSection, deleteCollegeSection,
} from "@/modules/academics/college-section-mutation-service";

import { deleteCollegeSection, CollegeSectionLifecycleError } from "@/modules/academics/college-section-lifecycle-service";

export const runtime = "nodejs";

export async function PATCH(request: Request, {
  params,
}: {
  params: Promise<{ sectionId: string }>;
}) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const context = await getCurrentRequestContext();
    const { sectionId } = await params;
    const body: unknown = await request.json();
    const section = await updateCollegeSection(context, sectionId, body);
    return NextResponse.json({ section });
  } catch (error) {
    if (error instanceof CollegeSectionError) {
      return NextResponse.json({ error: error.code }, {
        status: error.code === "CLASS_NOT_FOUND" ||
          error.code === "CLASS_COHORT_NOT_FOUND" ? 404 : 409,
      });
    }
    return apiErrorResponse(error);
  }
}

export async function DELETE(request: Request, {
  params,
}: {
  params: Promise<{ sectionId: string }>;
}) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const { sectionId } = await params;
    const deleted = await deleteCollegeSection(await getCurrentRequestContext(), sectionId);
    return NextResponse.json({ deleted });
  } catch (error) {
    if (error instanceof CollegeSectionError) {
      return NextResponse.json({ error: error.code, message: error.message }, {
        status: error.code === "CLASS_NOT_FOUND" ? 404 : 409,
      });
    }
    return apiErrorResponse(error);
  }
}
