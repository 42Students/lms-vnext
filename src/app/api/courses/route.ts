import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  createCourse,
  listCourses,
  listCoursesPage,
} from "@/modules/courses/course-service";
import {projectLegacyCoursePublic} from "@/modules/courses/legacy-course-public-projection";

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
 "GET /fetchAllPaged": "College-scoped GET /api/courses?collegeId={uuid}&page={legacyPage+1}&size={size}; no identical global JSON endpoint (authorized global /admin/courses catalogue is a page, not a legacy API)",
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
    const collegeId=url.searchParams.get("collegeId") ?? "";
    const departmentId=url.searchParams.get("departmentId");
    const includeArchived=url.searchParams.get("includeArchived") === "true" ||
      url.searchParams.get("onlyArchived") === "true";
    const onlyArchived=url.searchParams.get("onlyArchived") === "true";
    const rawView=url.searchParams.get("view");
    if(rawView!==null&&rawView!=="legacy"&&rawView!=="vnext")
      return NextResponse.json({error:"INVALID_VIEW"},{status:400});
    const legacyView=rawView==="legacy";
    const rawPage=url.searchParams.get("page");
    const rawSize=url.searchParams.get("size");
    if(rawPage!==null||rawSize!==null){
      // The legacy unpaged reader is intentionally separate. A requested
      // page must use scoped SQL LIMIT/OFFSET and a DB COUNT instead of
      // loading every course into memory before slicing.
      const page=rawPage===null?1:Number(rawPage);
      const size=rawSize===null?25:Number(rawSize);
      if(!Number.isSafeInteger(page)||page<1||page>100000||
         !Number.isSafeInteger(size)||size<1||size>100)
        return NextResponse.json({error:"INVALID_PAGINATION"},{status:400});
      const listing=await listCoursesPage(context,collegeId,{
        limit:size,offset:(page-1)*size,
      },departmentId,includeArchived,onlyArchived);
      return NextResponse.json({courses:legacyView
        ?listing.courses.map(projectLegacyCoursePublic):listing.courses,
        page,size,totalElements:listing.total,
        totalPages:Math.ceil(listing.total/size)},
        {headers:{"Cache-Control":"private, no-store"}});
    }
    const courses=await listCourses(context,collegeId,departmentId,
      includeArchived,undefined,onlyArchived);
    return NextResponse.json({courses:legacyView
      ?courses.map(projectLegacyCoursePublic):courses},
      {headers:{"Cache-Control":"private, no-store"}});
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
