import { NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { courseSectionDeliveries, courseOfferings, courses, departments } from "@/db/schema";
import { resolveActingCollege } from "@/modules/permissions/acting-college";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  createSectionFacultyAssignment,
  bulkCreateSectionFacultyAssignments,
  endSectionFacultyAssignment,
  listSectionFacultyAssignments,
  listFacultyCourseAssociations,
} from "@/modules/academics/faculty-assignment-service";

import { createCourseTeachingAssignment, listCourseFacultyAcrossDeliveries } from "@/modules/courses/teaching-assignment-service";

export const runtime = "nodejs";
/** Legacy faculty-course association crosswalk:
 * getByFaculty/course => GET courseId or courseSlug scoped delivery roster;
 * findByFacultyCourseClass => delivery/section-scoped lookup (never ID cast);
 * create => POST deliveryId for teacher role, or sectionId for advisor;
 * createBulk => POST {assignments:[]} atomically;
 * deactivate => PATCH {assignmentId,action:"DEACTIVATE"} retaining history.
 * Legacy numeric class/faculty IDs require authorized membership resolution.
 */

export async function GET(request: Request) {
  try {
    const context = await getCurrentRequestContext();
    const url = new URL(request.url);
    // Legacy courseSlug wins over courseId, but must resolve to one scoped
    // course; neither a section advisor nor a class ID grants teaching access.
    // Legacy class+course+faculty directory: every supplied identifier is a
    // scoped UUID, not a cast of a historic numeric ID.
    if (!url.searchParams.has("courseSlug") &&
      (url.searchParams.has("classId") || url.searchParams.has("facultyId"))) {
      const selectors=z.strictObject({
        classId:z.string().uuid().optional(),
        facultyMembershipId:z.string().uuid().optional(),
        courseId:z.string().uuid().optional(),
      }).parse({
        classId:url.searchParams.get("classId") ?? undefined,
        facultyMembershipId:url.searchParams.get("facultyId") ?? undefined,
        courseId:url.searchParams.get("courseId") ?? undefined,
      });
      const directory=await listFacultyCourseAssociations(context,{
        ...(selectors.classId !== undefined ? {classId:selectors.classId} : {}),
        ...(selectors.facultyMembershipId !== undefined ? {facultyMembershipId:selectors.facultyMembershipId} : {}),
        ...(selectors.courseId !== undefined ? {courseId:selectors.courseId} : {}),
        includeEnded:url.searchParams.get("includeEnded")==="true",
        limit:200,
      });
      return NextResponse.json({assignments:directory.rows,summary:directory.summary});
    }
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
    if (body && typeof body==="object" && !Array.isArray(body) &&
      "facultyId" in body && "courseId" in body && "classId" in body) {
      const legacy=z.strictObject({
        facultyId:z.string().uuid(),courseId:z.string().uuid(),classId:z.string().uuid(),
        role:z.enum(["PRIMARY","CO_TEACHER","TA"]).optional(),
      }).parse(body);
      const acting=await resolveActingCollege(context,"courses.manage");
      const matches=await getDb().select({deliveryId:courseSectionDeliveries.id})
        .from(courseSectionDeliveries)
        .innerJoin(courseOfferings,eq(courseOfferings.id,courseSectionDeliveries.offeringId))
        .innerJoin(courses,eq(courses.id,courseOfferings.courseId))
        .innerJoin(departments,eq(departments.id,courses.departmentId))
        .where(and(
          eq(courseSectionDeliveries.sectionId,legacy.classId),
          eq(courses.id,legacy.courseId),
          eq(departments.collegeId,acting.collegeId),
          isNull(courseSectionDeliveries.endedAt),
        )).limit(2);
      if(matches.length!==1)return NextResponse.json({
        error:"SECTION_DELIVERY_NOT_FOUND",
        message:"Select a class, course and semester for this teaching assignment.",
      },{status:409});
      const assignment=await createCourseTeachingAssignment(context,{
        deliveryId:matches[0]!.deliveryId,membershipId:legacy.facultyId,
        role:legacy.role??"PRIMARY",
      });
      return NextResponse.json({assignment,message:"Success"},{status:201});
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
