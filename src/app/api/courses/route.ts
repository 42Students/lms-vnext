import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  createCourse,
  listCourses,
} from "@/modules/courses/course-service";

export const runtime = "nodejs";
/** Legacy /api/v1/courses operations remain historical URLs, not live
 * compatibility aliases. Authenticated consumers must use these vNext routes.
 * The old numeric IDs must be resolved explicitly before mutation. */
export const LEGACY_COURSE_API_CROSSWALK = {
 "GET /fetch": "GET /api/courses?collegeId={uuid}",
 "GET /fetchAll": "GET /api/courses?collegeId={uuid}",
 "GET /fetchByCollege": "GET /api/courses?collegeId={uuid}",
 "GET /fetchByDepartment": "GET /api/courses?collegeId={uuid}&departmentId={uuid}",
 "GET /fetch/{id}": "GET /api/courses/{courseId}",
 "POST /create": "POST /api/courses",
 "PUT /update/{id}": "PATCH /api/courses/{courseId} (expectedUpdatedAt required)",
 "DELETE /delete/{id}": "DELETE /api/courses/{courseId} (soft archive)",
 "GET /deleted": "GET /api/courses?collegeId={uuid}&includeArchived=true",
 "POST /restore": "UNSUPPORTED: no vetted archived-course restore endpoint",
} as const;


export async function GET(request: Request) {
  try {
    const context = await getCurrentRequestContext();
    const url = new URL(request.url);
    const courses = await listCourses(
      context,
      url.searchParams.get("collegeId") ?? "",
      url.searchParams.get("departmentId"),
      url.searchParams.get("includeArchived") ===
        "true",
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
