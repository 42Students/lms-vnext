import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {createCourseAssignment} from "@/modules/courses/assignment-service";
import {toModernAssignmentWrite} from "@/modules/courses/admin-assignment-legacy-compat";
import {requirePermission} from "@/modules/permissions/policy";
import {loadCourseLessonScope} from "@/modules/courses/scope";
import {z} from "zod";
import {eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {courseOfferings} from "@/db/schema";
export const runtime="nodejs";
/** Compatibility adapter for retired /api/v1/admin/assignments/content/save.
 * Uses the one registered vNext authoring transaction; no opaque historical
 * resource DTO is silently ignored or written without verified uploads. */
export async function POST(request:Request){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const ctx=await getCurrentRequestContext();
  const raw:unknown=await request.json();
  const input=toModernAssignmentWrite(raw);
  const lesson=await loadCourseLessonScope(input.lessonId);
  requirePermission(ctx,"courses.manage",{
   collegeId:lesson.collegeId,organizationId:lesson.organizationId,
  });
  if(raw&&typeof raw==="object"&&"courseId" in raw&&raw.courseId!==undefined){
   const courseId=z.uuid().parse(raw.courseId);
   // Legacy had a raw courseId; the vNext lesson owns its offering, not
   // an independently trusted course/college selector. Callers must use
   // the authorized lesson UUID and cannot assert a different course.
   const [offering]=await getDb().select({courseId:courseOfferings.courseId})
    .from(courseOfferings).where(eq(courseOfferings.id,lesson.offeringId)).limit(1);
   if(!offering||offering.courseId!==courseId)
    return NextResponse.json({error:"ASSIGNMENT_COURSE_SCOPE_INVALID"},{status:400});
  }
  const assignment=await createCourseAssignment(ctx,input);
  return NextResponse.json({assignment,message:"Assignment saved"},{status:201});
 }catch(error){return apiErrorResponse(error);}
}
