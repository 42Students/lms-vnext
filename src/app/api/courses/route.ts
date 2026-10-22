import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  createCourse,
  listCourses,
} from "@/modules/courses/course-service";

export const runtime = "nodejs";
/** Historical /api/v1/courses endpoints are NOT live aliases. Old callers
 * must use the authenticated vNext API, resolve legacy integer IDs via an
 * imported, college-scoped crosswalk, and adapt the response before rendering.
 * Unlike the old Response(status, message, data) envelope, vNext returns
 * {course}/{courses} or {courses,page,size,totalElements,totalPages}.
 * vNext paging is 1-based; Spring PageResponseDTO was 0-based and also
 * included content/number/first/last. Never silently use a raw legacy ID.
 *
 * Deprecated legacy clients: AdminService/course API helpers, Course Home
 * and course selection links referring to /api/v1/courses. They must be
 * migrated individually; this constant does not install a redirect.
 */
export const LEGACY_COURSE_API_CROSSWALK = {
 "GET /fetch": "GET /api/courses?collegeId={uuid}&departmentId={uuid} (legacy deptId must resolve within selected college)",
 "GET /fetchAll": "GET /api/courses?collegeId={uuid} or authorized /admin/courses global catalogue (Super Admin scope)",
 "GET /fetchAllPaged": "GET /api/courses?page={legacyPage+1}&size={size}&collegeId={uuid} (Super Admin scope, 1-based vNext pagination)",
 "GET /fetchByCollege": "GET /api/courses?collegeId={uuid}",
 "GET /fetchByCollegePaged": "GET /api/courses?collegeId={uuid}&page={legacyPage+1}&size={size}",
 "GET /fetchByDepartment": "GET /api/courses?collegeId={uuid}&departmentId={uuid}",
 "GET /fetchCourse": "GET /api/courses/{uuid} (resolve legacy numeric courseId inside authorized college first)",
 "GET /fetch/{id}": "GET /api/courses/{uuid} (legacy numeric IDs require a verified crosswalk)",
 "GET /by-slug/{slug}": "GET /api/courses/by-slug/{slug}?collegeId={uuid} (authenticated, same-college resolver)",
 "GET /{courseId}/slug": "GET /api/courses/{uuid} then read course.slug (legacy integer -> scoped UUID)",
 "GET /fetchCourseName": "GET /api/courses/by-slug/{slug}?collegeId={uuid} or GET /api/courses/{uuid} then read course.name",
 "POST /create": "POST /api/courses (201 {course}; legacy /create returned 200 Response.data)",
 "PUT /update/{id}": "PATCH /api/courses/{uuid} (same-origin; expectedUpdatedAt required; 200 {course})",
 "DELETE /delete/{id}": "DELETE /api/courses/{uuid} (soft archive; 200 {course}, not legacy deletion envelope)",
 "GET /deleted": "GET /api/courses?collegeId={uuid}&onlyArchived=true (courses.manage required)",
 "POST /restore": "POST /api/courses/{uuid}/restore (authorized archived-course restore)",
 "POST /restore/{id}": "POST /api/courses/{uuid}/restore (legacy integer/collegeId crosswalk required)",
} as const;

export async function GET(request: Request) {
  try {
    const context = await getCurrentRequestContext();
    const url = new URL(request.url);
    const courses = await listCourses(
      context,
      url.searchParams.get("collegeId") ?? "",
      url.searchParams.get("departmentId"),
      url.searchParams.get("includeArchived") === "true" ||
        url.searchParams.get("onlyArchived") === "true",
      undefined,
      url.searchParams.get("onlyArchived") === "true",
    );

    const rawPage=url.searchParams.get("page");
    const rawSize=url.searchParams.get("size");
    if(rawPage!==null||rawSize!==null){
      const page=rawPage===null?1:Number(rawPage);
      const size=rawSize===null?25:Number(rawSize);
      if(!Number.isSafeInteger(page)||page<1||page>100000||
         !Number.isSafeInteger(size)||size<1||size>100)
        return NextResponse.json({error:"INVALID_PAGINATION"},{status:400});
      const start=(page-1)*size;
      return NextResponse.json({courses:courses.slice(start,start+size),
        page,size,totalElements:courses.length,
        totalPages:Math.ceil(courses.length/size)});
    }
    return NextResponse.json({ courses });
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
    const course = await createCourse(
      context,
      body,
    );

    return NextResponse.json(
      { course },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
