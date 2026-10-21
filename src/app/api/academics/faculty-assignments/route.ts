import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  createSectionFacultyAssignment,
  bulkCreateSectionFacultyAssignments,
  endSectionFacultyAssignment,
  listSectionFacultyAssignments,
} from "@/modules/academics/faculty-assignment-service";

import { createCourseTeachingAssignment, listCourseFacultyAcrossDeliveries } from "@/modules/courses/teaching-assignment-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const context = await getCurrentRequestContext();
    const url = new URL(request.url);
    // Legacy courseSlug wins over courseId, but must resolve to one scoped
    // course; neither a section advisor nor a class ID grants teaching access.
    const course = url.searchParams.get("courseSlug") || url.searchParams.get("courseId");
    if (course) {
      const assignments = await listCourseFacultyAcrossDeliveries(
        context, course, url.searchParams.get("includeEnded") === "true");
      return NextResponse.json({ assignments });
    }
    const assignments =
      await listSectionFacultyAssignments(
        context,
        url.searchParams.get("sectionId") ?? "",
        url.searchParams.get("includeEnded") ===
          "true",
      );

    return NextResponse.json({ assignments });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }

  try {
    const context = await getCurrentRequestContext();
    const body = await request.json();
    // Bulk section mappings are prevalidated and committed atomically.
    if (Array.isArray(body) || (body && typeof body === "object" && Array.isArray(body.assignments))) {
      const assignments = await bulkCreateSectionFacultyAssignments(context,
        Array.isArray(body) ? body : body.assignments);
      return NextResponse.json({ assignments, message: "Success" }, { status: 201 });
    }
    if (body && typeof body === "object" && "deliveryId" in body) {
      // Course teaching assignments require an explicit live delivery; a
      // legacy class/course pair alone is ambiguous across terms/electives.
      const assignment = await createCourseTeachingAssignment(context, body);
      return NextResponse.json({ assignment, message: "Success" }, { status: 201 });
    }
    const assignment = await createSectionFacultyAssignment(context, body);
    return NextResponse.json({ assignment, message: "Success" }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}


/** Deactivate section mappings without losing history (legacy mapping action). */
export async function PATCH(request: Request) {
  if (!isSameOriginRequest(request))
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  try {
    const context = await getCurrentRequestContext();
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || !("assignmentId" in body) ||
      typeof body.assignmentId !== "string" || !("action" in body) ||
      body.action !== "DEACTIVATE")
      return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
    const assignment = await endSectionFacultyAssignment(context, body.assignmentId);
    return NextResponse.json({ assignment, message: "Mapping deactivated" });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
