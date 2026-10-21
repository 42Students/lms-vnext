import { NextResponse } from "next/server";
import {z} from "zod";
import {and,eq,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {courses,departments} from "@/db/schema";
import {loadCourseScope} from "@/modules/courses/scope";
import {loadAcademicCollegeScope} from "@/modules/academics/scope";
import {requirePermission} from "@/modules/permissions/policy";
import {CoursesServiceError} from "@/modules/courses/errors";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  archiveCourse,
  updateCourse,
} from "@/modules/courses/course-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ courseId: string }>;
};

/** Legacy course route crosswalk (no misleading archive/delete parity):
 * POST /api/v1/courses/create -> POST /api/courses (201 {course})
 * GET /fetch, /fetchAll, /fetchByCollege -> GET /api/courses?collegeId=
 * GET /by-slug/{slug}, /fetchCourse?courseId, /{id}/slug -> authenticated
 *   GET /api/courses/{uuid or code}?collegeId=; historic numeric IDs need a
 *   dedicated, verified mapping table before aliases can be redirected.
 * PUT /update/{id} -> PATCH /api/courses/{uuid} (CAS expectedUpdatedAt)
 * DELETE /delete/{id} -> DELETE /api/courses/{uuid} (ARCHIVE, not hard delete)
 * GET /deleted and POST /restore have no safe vNext equivalents yet.
 * No unverified image upload or object cleanup is performed by metadata PATCH.
 */
const courseUuid=z.string().uuid();
const validSlug=/^[A-Za-z][A-Za-z0-9._-]{0,63}$/;
function slugError(message:string){
 return NextResponse.json({error:"INVALID_SLUG",message},{status:400,headers:{"Cache-Control":"private, no-store"}});
}
/** Read a course without using a guessed numeric legacy ID or leaking tenants.
 * A supplied courseSlug must resolve to the same authorized course ID. */
export async function GET(request:Request,{params}:RouteContext){
 try{
  const context=await getCurrentRequestContext();
  const {courseId:raw}=await params;
  const id=raw.trim();
  const url=new URL(request.url);
  const providedSlug=url.searchParams.get("courseSlug");
  const rawCollegeId=url.searchParams.get("collegeId");
  if(url.searchParams.getAll("collegeId").length>1||url.searchParams.getAll("courseSlug").length>1)
   return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
  if(!id)return slugError("Slug is required");
  if(/^\d+$/.test(id))return slugError("Use courseId parameter for numeric identifiers");
  if(providedSlug!==null&&(!validSlug.test(providedSlug)||providedSlug.length>64))
   return slugError("Invalid slug format");
  let scope:Awaited<ReturnType<typeof loadCourseScope>>;
  const parsedId=courseUuid.safeParse(id);
  if(parsedId.success){
   scope=await loadCourseScope(parsedId.data);
   requirePermission(context,"courses.read",{organizationId:scope.organizationId,collegeId:scope.collegeId});
   if(rawCollegeId&&rawCollegeId!==scope.collegeId)throw new CoursesServiceError("COURSE_NOT_FOUND");
  }else{
   if(!validSlug.test(id))return slugError("Invalid slug format");
   if(!rawCollegeId)return NextResponse.json({error:"INVALID_SCOPE"},{status:400});
   const college=await loadAcademicCollegeScope(courseUuid.parse(rawCollegeId));
   requirePermission(context,"courses.read",{organizationId:college.organizationId,collegeId:college.id});
   const matched=await getDb().select({id:courses.id}).from(courses)
    .innerJoin(departments,eq(departments.id,courses.departmentId))
    .where(and(eq(departments.collegeId,college.id),eq(courses.status,"ACTIVE"),
     sql`lower(${courses.code}) = ${id.toLowerCase()}`)).limit(2);
   if(matched.length!==1)throw new CoursesServiceError("COURSE_NOT_FOUND");
   scope=await loadCourseScope(matched[0]!.id);
  }
  if(providedSlug!==null&&scope.code.toLowerCase()!==providedSlug.toLowerCase())
   return NextResponse.json({error:"COURSE_SLUG_ID_MISMATCH",
    message:"courseSlug and courseId do not refer to the same course"},
    {status:400,headers:{"Cache-Control":"private, no-store"}});
  return NextResponse.json({course:scope},{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
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
    const { courseId } = await params;
    const body = await request.json();
    const course = await updateCourse(
      context,
      courseId,
      body,
    );

    return NextResponse.json({ course });
  } catch (error) {
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
    const context = await getCurrentRequestContext();
    const { courseId } = await params;
    const course = await archiveCourse(
      context,
      courseId,
    );

    return NextResponse.json({ course });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
