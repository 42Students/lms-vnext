import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {and,eq} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {courses,departments} from "@/db/schema";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {requirePermission} from "@/modules/permissions/policy";
import {loadCourseScope} from "@/modules/courses/scope";
import {legacyCourseMetadataPreview} from "@/modules/courses/legacy-course-metadata-preview";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const privateHeaders={"Cache-Control":"private, no-store",Vary:"Cookie"} as const;
export const GET = route(
  { auth: "user", permission: "courses.manage" },
  async ({ context: __actor, params }) => {
    const context = __actor!;
    try {
const {courseId}=params;
const id=z.string().uuid().parse(courseId);
const scope=await loadCourseScope(id);
requirePermission(context,"courses.manage",{
   collegeId:scope.collegeId,organizationId:scope.organizationId,
  });
const [metadata]=await getDb().select({
   id:courses.id,name:courses.name,code:courses.code,
   shortTitle:courses.shortTitle,officialCode:courses.officialCode,
   cardColor:courses.cardColor,description:courses.description,
   legacyMetadata:courses.legacyMetadata,updatedAt:courses.updatedAt,
  }).from(courses).innerJoin(departments,and(
    eq(departments.id,courses.departmentId),eq(departments.collegeId,scope.collegeId),
  )).where(eq(courses.id,id)).limit(1);
if(!metadata)return NextResponse.json({error:"COURSE_NOT_FOUND"},{status:404,headers:privateHeaders});
const {legacyMetadata,...safeMetadata}=metadata;
return NextResponse.json({metadata:{...safeMetadata,
   legacyFields:legacyCourseMetadataPreview(legacyMetadata),
  }},{headers:privateHeaders});
} catch(error){
  const response=apiErrorResponse(error);
  response.headers.set("Cache-Control","private, no-store");
  response.headers.set("Vary","Cookie");
  return response;
 }
  },
);
